// src/renderer/services/ipcServices.ts

import { toast } from "sonner";
import { toErrorMessage } from "@renderer/utils/rendererUtils";
import type {
  EmailTemplateKey,
  GmailDraftFormValues,
} from "@renderer/features/other/types/gmailDraftUiTypes";
import type { AuthProfile } from "@shared/types/auth/authTypes";
import {
  IPC_CHANNELS,
  type TempomaticUploadTargetFile,
} from "@shared/types/electron/ipcTypes";
import type { SpreadsheetMasterDataResponse } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { RdpTarget } from "@shared/types/electron/ipcTypes";
import type { UpdateInfo } from "@shared/types/electron/ipcTypes";

export interface GenerateDraftTemplateParams {
  templateKey: EmailTemplateKey;
  links?: Record<string, string> | null;
}

export interface UploadDocumentParams {
  filePaths?: string[];
  files?: TempomaticUploadTargetFile[];
  expireDate?: string;
}

export const authIpcService = {
  login: (): Promise<AuthProfile> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGIN),

  loadSession: (forceRefresh = false): Promise<AuthProfile | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOAD_SESSION, forceRefresh),

  logout: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGOUT),
};

export const spreadsheetIpcService = {
  getMasterData: (): Promise<SpreadsheetMasterDataResponse> =>
    window.electronAPI.invoke(IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA),
};

export const rdpIpcService = {
  getMasters: (): Promise<RdpTarget[]> =>
    window.electronAPI.invoke(IPC_CHANNELS.RDP.GET_MASTERS),

  startSession: (name: string): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.RDP.START_SESSION, { name }),
};

export const otherIpcService = {
  getGmailSignature: (): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.GMAIL.GET_SIGNATURE),

  generateDraftTemplate: (
    params: GenerateDraftTemplateParams,
  ): Promise<GmailDraftFormValues> =>
    window.electronAPI.invoke(
      IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE,
      params,
    ),

  createGmailDraft: (formValues: GmailDraftFormValues): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.GMAIL.CREATE_DRAFT, formValues),

  uploadTempomaticPdf: (params: UploadDocumentParams): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT, params),

  processGiftMd: (filePath: string): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.OTHER.PROCESS_GIFT_MD, filePath),
};

export const systemIpcService = {
  getAppVersion: (): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.GET_APP_VERSION),

  showMainWindow: (): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.SHOW_MAIN_WINDOW),

  quitApp: (): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.QUIT_APP),

  openManual: (target: string, isAuto = false): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_MANUAL, {
      target,
      isAuto,
    }),

  openExternal: (urlOrPath: string): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, { urlOrPath }),

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
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.SHOW_OPEN_DIALOG, options),

  readUpdateInfo: (): Promise<UpdateInfo | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.READ_UPDATE_INFO),

  renameFile: (
    filePath: string,
    newName: string,
  ): Promise<{ success: boolean; newPath: string }> =>
    window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.RENAME_FILE, {
      filePath,
      newName,
    }),
};
