// electron/ipc/gmailIpc.ts

import { ipcMain } from "electron";
import {
  createGmailDraft,
  fetchPrimarySignature,
  generateDraftTemplate,
} from "@electron/features/gmail/gmailService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

export function registerGmailIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.GMAIL.GET_SIGNATURE,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.GMAIL.GET_SIGNATURE]["return"]
    > => {
      return fetchPrimarySignature();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE,
    async (
      _event,
      params: IpcChannelMap[typeof IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.GMAIL.GENERATE_DRAFT_TEMPLATE]["return"]
    > => {
      return generateDraftTemplate(params);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.GMAIL.CREATE_DRAFT,
    async (
      _event,
      params: IpcChannelMap[typeof IPC_CHANNELS.GMAIL.CREATE_DRAFT]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.GMAIL.CREATE_DRAFT]["return"]
    > => {
      return createGmailDraft(params);
    },
  );
}
