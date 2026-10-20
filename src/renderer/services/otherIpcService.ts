// src/renderer/services/otherIpcService.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type {
  EmailTemplateKey,
  GmailDraftFormValues,
} from "@renderer/features/other/types/gmailDraftTypes";

export interface GenerateDraftTemplateParams {
  templateKey: EmailTemplateKey;
  familyName?: string;
  links?: Record<string, string> | null;
}

export interface UploadDocumentParams {
  filePaths: string[];
  expireDate?: string;
}

/**
 * その他機能（Gmail下書き・Tempomatic PDF・ギフトMD）の IPC 通信を集約するサービス
 */
export const otherIpcService = {
  // --- Gmail ---
  getGmailSignature: (): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.GMAIL.GET_SIGNATURE),

  generateDraftTemplate: (
    params: GenerateDraftTemplateParams,
  ): Promise<GmailDraftFormValues> =>
    window.electronAPI.invoke(
      IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE,
      params,
    ),

  createGmailDraft: (formValues: GmailDraftFormValues): Promise<unknown> =>
    window.electronAPI.invoke(IPC_CHANNELS.GMAIL.CREATE_DRAFT, formValues),

  // --- Tempomatic ---
  uploadTempomaticPdf: (params: UploadDocumentParams): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.TEMPOMATIC.UPLOAD_DOCUMENT, params),

  // --- ギフトMD ---
  processGiftMd: (filePath: string): Promise<string> =>
    window.electronAPI.invoke(IPC_CHANNELS.OTHER.PROCESS_GIFT_MD, filePath),
};
