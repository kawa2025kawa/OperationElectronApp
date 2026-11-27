// src/renderer/services/ipcServices.ts

import { toast } from "sonner";
import { toErrorMessage } from "@renderer/utils/rendererUtils";
import type { GmailDraftFormValues } from "@renderer/features/other/types/gmailDraftUiTypes";
import type { AuthProfile } from "@shared/types/auth/authTypes";
import {
  IPC_CHANNELS,
  type GenerateDraftTemplateParams,
  type IpcChannelMap,
  type RdpTarget,
  type StaffScheduleSheetId,
  type TempomaticUploadTargetFile,
  type UpdateInfo,
} from "@shared/types/electron/ipcTypes";
import type {
  ShopResourceKey,
  SpreadsheetMasterDataResponse,
} from "@shared/types/spreadsheet/spreadsheetTypes";

interface UploadDocumentParams {
  filePaths?: string[];
  files?: TempomaticUploadTargetFile[];
  expireDate?: string;
}

/** 型安全な IPC 呼び出し共通ラッパー */
export function invokeIpc<K extends keyof IpcChannelMap>(
  channel: K,
  ...args: IpcChannelMap[K]["args"]
): Promise<IpcChannelMap[K]["return"]> {
  return window.electronAPI.invoke(channel, ...args);
}

export const authIpcService = {
  login: (): Promise<AuthProfile> => invokeIpc(IPC_CHANNELS.AUTH.LOGIN),

  loadSession: (forceRefresh = false): Promise<AuthProfile | null> =>
    invokeIpc(IPC_CHANNELS.AUTH.LOAD_SESSION, forceRefresh),

  logout: (): Promise<void> => invokeIpc(IPC_CHANNELS.AUTH.LOGOUT),
};

export const spreadsheetIpcService = {
  getMasterData: (): Promise<SpreadsheetMasterDataResponse> =>
    invokeIpc(IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA),

  openStaffSchedule: (
    sheetId: StaffScheduleSheetId,
    staffId: string,
  ): Promise<null> =>
    invokeIpc(IPC_CHANNELS.SPREADSHEET.OPEN_STAFF_SCHEDULE, {
      sheetId,
      staffId,
    }),

  openShopResource: (
    shopCode: string,
    resourceKey: ShopResourceKey,
  ): Promise<null> =>
    invokeIpc(IPC_CHANNELS.SPREADSHEET.OPEN_SHOP_RESOURCE, {
      shopCode,
      resourceKey,
    }),
};

export const rdpIpcService = {
  getMasters: (): Promise<RdpTarget[]> =>
    invokeIpc(IPC_CHANNELS.RDP.GET_MASTERS),

  startSession: (name: string): Promise<null> =>
    invokeIpc(IPC_CHANNELS.RDP.START_SESSION, { name }),
};

export const otherIpcService = {
  getGmailSignature: (): Promise<string> =>
    invokeIpc(IPC_CHANNELS.GMAIL.GET_SIGNATURE),

  generateDraftTemplate: (
    params: GenerateDraftTemplateParams,
  ): Promise<GmailDraftFormValues> =>
    invokeIpc(IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE, params),

  createGmailDraft: (formValues: GmailDraftFormValues): Promise<void> =>
    invokeIpc(IPC_CHANNELS.GMAIL.CREATE_DRAFT, formValues),

  uploadTempomaticPdf: (params: UploadDocumentParams): Promise<string> =>
    invokeIpc(IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT, params),

  processGiftMd: (filePath: string): Promise<string> =>
    invokeIpc(IPC_CHANNELS.OTHER.PROCESS_GIFT_MD, filePath),
};

export const systemIpcService = {
  getAppVersion: (): Promise<string> =>
    invokeIpc(IPC_CHANNELS.SYSTEM.GET_APP_VERSION),

  showMainWindow: (): Promise<null> =>
    invokeIpc(IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW),

  quitApp: (): Promise<null> => invokeIpc(IPC_CHANNELS.SYSTEM.QUIT_APP),

  openManual: (target: string, isAuto = false): Promise<null> =>
    invokeIpc(IPC_CHANNELS.SYSTEM.OPEN_MANUAL, {
      target,
      isAuto,
    }),

  openExternal: (urlOrPath: string): Promise<null> =>
    invokeIpc(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, { urlOrPath }),

  openExternalWithToast: async (
    urlOrPath: string,
    errorPrefix = "外部リンク起動エラー",
  ): Promise<void> => {
    const cleanTarget = urlOrPath.trim();
    if (!cleanTarget) return;

    try {
      await systemIpcService.openExternal(cleanTarget);
    } catch (error) {
      toast.error(`${errorPrefix}: ${toErrorMessage(error)}`);
    }
  },

  showOpenDialog: (
    options?: Record<string, unknown>,
  ): Promise<string[] | null> =>
    invokeIpc(IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG, options),

  readUpdateInfo: (): Promise<UpdateInfo | null> =>
    invokeIpc(IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO),

  renameFile: (
    filePath: string,
    newName: string,
  ): Promise<{ success: boolean; newPath: string }> =>
    invokeIpc(IPC_CHANNELS.SYSTEM.RENAME_FILE, {
      filePath,
      newName,
    }),
};
