// electron/ipc/gmailIpc.ts

import { ipcMain } from "electron";
import {
  createGmailDraft,
  fetchPrimarySignature,
  generateDraftTemplate,
} from "@electron/features/gmail/gmailService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

export function registerGmailIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.GMAIL.GET_SIGNATURE,
    async (): Promise<string> => {
      return fetchPrimarySignature();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE,
    async (
      _event,
      params: {
        templateKey: "E8" | "E9" | "E10";
        familyName?: string;
        links?: Record<string, string> | null;
      },
    ) => {
      return generateDraftTemplate(params);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GMAIL.CREATE_DRAFT,
    async (
      _event,
      params: {
        to?: string;
        cc?: string;
        subject?: string;
        body?: string;
        raw?: string;
      },
    ) => {
      return createGmailDraft(params);
    },
  );
}
