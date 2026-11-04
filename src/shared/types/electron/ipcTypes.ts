// src/shared/types/electron/ipcTypes.ts

import type { AuthProfile } from "@shared/types/auth";
import type { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type {
  EmailTemplateKey,
  GmailDraftFormValues,
} from "@shared/types/gmail/gmailDraftTypes";
import type { SpreadsheetMasterDataResponse } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  ManualScriptExecutionInput,
  OperationStatusNotification,
  OperationStatusState,
  OperationViewItem,
  ScriptExecutionRequirement,
} from "@shared/types/operation/operationTypes";
import type { RdpTarget } from "@shared/types/rdp/rdpTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import type {
  StatusSummary,
  SummaryDetailRow,
} from "@shared/types/statusSummary/statusSummaryTypes";
import type { UpdateInfo } from "@shared/types/system";

/**
 * Renderer が受信する IPC イベントの型定義
 */
export interface IpcEventMap {
  [IPC_CHANNELS.SYSTEM.THEME_CHANGED]: [theme: "light" | "dark" | "system"];
  [IPC_CHANNELS.OPERATION.STATUS_UPDATED]: [
    notification: OperationStatusNotification,
  ];
  [IPC_CHANNELS.OPERATION.POLLING_CYCLE_COMPLETE]: [];
}

/**
 * Tempomatic アップロード対象ファイル
 */
export interface TempomaticUploadTargetFile {
  path: string;
  name?: string;
}

/**
 * IPC チャンネルごとの引数・戻り値定義
 *
 * Renderer と Main の間で受け渡すデータ契約を一元管理する。
 * Main 専用の型や認証情報は公開しない。
 */
interface IpcChannelDefinitions {
  // Auth
  [IPC_CHANNELS.AUTH.LOGIN]: () => AuthProfile;
  [IPC_CHANNELS.AUTH.LOAD_SESSION]: (
    forceRefresh?: boolean,
  ) => AuthProfile | null;
  [IPC_CHANNELS.AUTH.LOGOUT]: () => void;

  // System
  [IPC_CHANNELS.SYSTEM.GET_APP_VERSION]: () => string;
  [IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW]: () => null;
  [IPC_CHANNELS.SYSTEM.QUIT_APP]: () => null;
  [IPC_CHANNELS.SYSTEM.OPEN_MANUAL]: (input: {
    target: string;
    isAuto?: boolean;
  }) => null;
  [IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL]: (input: { urlOrPath: string }) => null;
  [IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG]: (
    options?: Record<string, unknown>,
  ) => string[] | null;
  [IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO]: () => UpdateInfo | null;
  [IPC_CHANNELS.SYSTEM.RENAME_FILE]: (input: {
    filePath: string;
    newName: string;
  }) => {
    success: boolean;
    newPath: string;
  };

  // RDP
  [IPC_CHANNELS.RDP.GET_MASTERS]: () => RdpTarget[];
  [IPC_CHANNELS.RDP.START_SESSION]: (input: { name: string }) => null;

  // Gmail
  [IPC_CHANNELS.GMAIL.GET_SIGNATURE]: () => string;
  [IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE]: (input: {
    templateKey: EmailTemplateKey;
    targetData?: Record<string, unknown>;
    familyName?: string;
    links?: Record<string, string> | null;
  }) => GmailDraftFormValues;
  [IPC_CHANNELS.GMAIL.CREATE_DRAFT]: (input: GmailDraftFormValues) => void;

  // Spreadsheet
  [IPC_CHANNELS.SPREADSHEET
    .GET_MASTER_DATA]: () => SpreadsheetMasterDataResponse;
  [IPC_CHANNELS.SPREADSHEET.GET_FILTERED_DATA]: (input: {
    sheetName: string;
    query?: string;
  }) => Record<string, unknown>[];

  // Tempomatic
  [IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT]: (input: {
    files?: TempomaticUploadTargetFile[];
    filePaths?: string[];
    expireDate?: string;
  }) => string;

  // Other
  [IPC_CHANNELS.OTHER.PROCESS_GIFT_MD]: (filePath: string) => string;

  // Operation
  [IPC_CHANNELS.OPERATION.GET_ACTIVE_FLAGS]: () => ActiveFlags;
  [IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY]: () => StatusSummary;
  [IPC_CHANNELS.OPERATION.GET_SUMMARY_DETAILS]: (input: {
    filterKey: string;
  }) => SummaryDetailRow[];
  [IPC_CHANNELS.OPERATION.GET_TABLE_DATA]: (input: {
    mode: ViewMode;
  }) => OperationViewItem[];
  [IPC_CHANNELS.OPERATION.GET_SCRIPT_EXECUTION_REQUIREMENT]: (input: {
    scriptKey: string;
  }) => ScriptExecutionRequirement;
  [IPC_CHANNELS.OPERATION.RESET_STATUSES]: () => Record<
    string,
    OperationStatusState
  >;
  [IPC_CHANNELS.OPERATION.SET_ACTIVE_FLAGS]: (
    input: Partial<ActiveFlags> | { flags: Partial<ActiveFlags> },
  ) => void;
  [IPC_CHANNELS.OPERATION.DELETE_ALL_STATUSES]: () => void;
  [IPC_CHANNELS.OPERATION.INITIALIZE_STATUS]: () => Record<
    string,
    OperationStatusState
  >;
  [IPC_CHANNELS.OPERATION.REGISTER_TARGETS]: () => void;
  [IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS]: (input: {
    kanriNo: string;
    status: JobStatus;
    comment?: string;
  }) => void;
  [IPC_CHANNELS.OPERATION.START_POLLING]: () => void;
  [IPC_CHANNELS.OPERATION.STOP_POLLING]: () => void;
  [IPC_CHANNELS.OPERATION.EXECUTE_SCRIPT]: (
    input: ManualScriptExecutionInput,
  ) => JobResult;
  [IPC_CHANNELS.OPERATION.FETCH_SINGLE_STATUS]: (input: {
    kanriNo: string;
  }) => OperationStatusState | null;
}

/**
 * invoke / ipcMain.handle 共通の引数・戻り値マッピング
 */
export type IpcChannelMap = {
  [K in keyof IpcChannelDefinitions]: {
    args: Parameters<IpcChannelDefinitions[K]>;
    return: ReturnType<IpcChannelDefinitions[K]>;
  };
};
