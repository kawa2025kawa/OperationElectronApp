// electron/features/other/ipc/giftMdIpc.ts

import { ipcMain } from "electron";
import { giftMdProcess } from "../service/giftMdService";

export function registerGiftMdIpc(): void {
  ipcMain.handle(
    "gift-md:process",
    async (_event, filePath?: string | string[]) => {
      try {
        return await giftMdProcess(filePath);
      } catch (error) {
        console.error("[IPC:gift-md:process] Error:", error);
        throw error;
      }
    },
  );
}
