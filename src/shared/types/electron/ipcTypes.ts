// src/shared/types/electron/ipcTypes.ts

import type { AuthProfile } from "@shared/types/auth/authTypes";
import type {
  ActiveFlags,
  JobResult,
  JobStatus,
  ManualScriptExecutionInput,
  OperationStatusNotification,
  OperationStatusState,
  OperationViewItem,
  ScriptExecutionRequirement,
  StatusSummary,
} from "@shared/types/operation/operationTypes";
import type { ViewMode } from "@shared/types/registry/viewDefinition";
import type {
  RdpTarget,
  SHEETS,
  ShopResourceKey,
  SpreadsheetMasterDataResponse,
} from "@shared/types/spreadsheet/spreadsheetTypes";

export type { RdpTarget };

/**
 * Gmail 下書き関連型定義
 */
export type EmailTemplateKey = "E8" | "E9" | "E10" | "E88";

export interface GmailDraft {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

export type GmailDraftFormValues = GmailDraft;

export interface EmailTemplateOption {
  key: EmailTemplateKey;
  label: string;
}

/**
 * アプリ更新情報型定義
 */
export interface UpdateInfo {
  version: string;
  notes?: string;
  pub_date?: string;
  platforms?: {
    "windows-x86_64"?: {
      url?: string;
    };
  };
}

/**
 * Electron IPC チャンネル名定数
 */
export const IPC_CHANNELS = {
  AUTH: {
    LOGIN: "googleAuth:login",
    LOAD_SESSION: "googleAuth:loadSession",
    LOGOUT: "googleAuth:logout",
  },
  SYSTEM: {
    GET_APP_VERSION: "getAppVersion",
    SHOW_MAIN_WINDOW: "showMainWindow",
    QUIT_APP: "quitApp",
    OPEN_MANUAL: "openManual",
    OPEN_EXTERNAL: "openExternal",
    SHOW_OPEN_DIALOG: "showOpenDialog",
    READ_UPDATE_INFO: "readUpdateInfo",
    RENAME_FILE: "system:renameFile",
  },
  RDP: {
    GET_MASTERS: "rdp:getMasters",
    START_SESSION: "rdp:startSession",
  },
  GMAIL: {
    GET_SIGNATURE: "gmail:getSignature",
    GENERATE_DRAFT_TEMPLATE: "gmail:generateDraftTemplate",
    CREATE_DRAFT: "gmail:createDraft",
  },
  SPREADSHEET: {
    GET_MASTER_DATA: "spreadsheet:master",
    OPEN_STAFF_SCHEDULE: "spreadsheet:openStaffSchedule",
    OPEN_SHOP_RESOURCE: "spreadsheet:openShopResource",
  },
  TEMPOMATIC: {
    UPLOAD_DOCUMENT: "tempomatic:uploadDocument",
  },
  OTHER: {
    PROCESS_GIFT_MD: "gift-md:process",
  },
  OPERATION: {
    GET_STATUS_SUMMARY: "operation:getStatusSummary",
    GET_TABLE_DATA: "operation:getTableData",
    GET_SCRIPT_EXECUTION_REQUIREMENT: "operation:getScriptExecutionRequirement",
    RESET_STATUSES: "operation:resetStatusesFromSpreadsheet",
    GET_ACTIVE_FLAGS: "operation:getActiveFlags",
    SET_ACTIVE_FLAGS: "operation:setActiveFlags",
    DELETE_ALL_STATUSES: "operation:deleteAllStatuses",
    INITIALIZE_STATUS: "operation:initializeStatus",
    REGISTER_TARGETS: "operation:registerTargets",
    UPDATE_JOB_STATUS: "operation:updateJobStatus",
    START_POLLING: "operation:startPolling",
    STOP_POLLING: "operation:stopPolling",
    EXECUTE_SCRIPT: "operation:executeScript",
    FETCH_SINGLE_STATUS: "operation:fetchSingleJobStatus",
    STATUS_UPDATED: "operation:status-updated",
    POLLING_CYCLE_COMPLETE: "polling-cycle-complete",
    SAVE_STATUSES_TO_SHEET: "operation:saveStatusesToSheet",
    PREVIEW_STATUS_SYNC_FROM_SHEET: "operation:previewStatusSyncFromSheet",
    LOAD_STATUSES_FROM_SHEET: "operation:loadStatusesFromSheet",
  },
} as const;

export interface IpcEventMap {
  [IPC_CHANNELS.OPERATION.STATUS_UPDATED]: [
    notification: OperationStatusNotification,
  ];
  [IPC_CHANNELS.OPERATION.POLLING_CYCLE_COMPLETE]: [];
}

export interface TempomaticUploadTargetFile {
  path: string;
  name?: string;
}

export interface StatusSyncMetadata {
  operatorName: string;
  savedAt: string;
  handoverNote: string;
  revision: number;
  activeFlags: ActiveFlags;
}

export interface SaveStatusSyncInput {
  operatorName?: string;
  handoverNote: string;
}

export interface SaveStatusSyncResult extends StatusSyncMetadata {
  savedCount: number;
}

export interface StatusSyncPreviewResult {
  hasData: boolean;
  metadata: StatusSyncMetadata | null;
}

export interface LoadStatusSyncResult {
  loadedCount: number;
  metadata: StatusSyncMetadata | null;
  loadedAt: string;
}

export type StaffScheduleSheetId =
  | typeof SHEETS.KOKYUHYO.sheetName
  | typeof SHEETS.JUGYOIN.sheetName;

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
    links?: Record<string, string> | null;
  }) => GmailDraftFormValues;
  [IPC_CHANNELS.GMAIL.CREATE_DRAFT]: (input: GmailDraftFormValues) => void;

  // Spreadsheet
  [IPC_CHANNELS.SPREADSHEET
    .GET_MASTER_DATA]: () => SpreadsheetMasterDataResponse;
  [IPC_CHANNELS.SPREADSHEET.OPEN_STAFF_SCHEDULE]: (input: {
    sheetId: StaffScheduleSheetId;
    staffId: string;
  }) => null;
  [IPC_CHANNELS.SPREADSHEET.OPEN_SHOP_RESOURCE]: (input: {
    shopCode: string;
    resourceKey: ShopResourceKey;
  }) => null;

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
  [IPC_CHANNELS.OPERATION.SAVE_STATUSES_TO_SHEET]: (
    input: SaveStatusSyncInput,
  ) => SaveStatusSyncResult;
  [IPC_CHANNELS.OPERATION
    .PREVIEW_STATUS_SYNC_FROM_SHEET]: () => StatusSyncPreviewResult;
  [IPC_CHANNELS.OPERATION.LOAD_STATUSES_FROM_SHEET]: () => LoadStatusSyncResult;
}

export type IpcChannelMap = {
  [K in keyof IpcChannelDefinitions]: {
    args: Parameters<IpcChannelDefinitions[K]>;
    return: ReturnType<IpcChannelDefinitions[K]>;
  };
};
