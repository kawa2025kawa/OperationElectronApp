// electron/features/other/ipc/giftMdIpc.ts
import { ipcMain } from "electron";
import { runJobE41 } from "@electron/features/operation/jobs/scripts/eseries/job_e41";

let registered = false;

export function registerGiftMdIpc(): void {
  if (registered) return;
  registered = true;

  ipcMain.handle(
    "gift-md:process",
    async (_event, filePath?: string | string[]) => {
      try {
        return await runJobE41(filePath);
      } catch (error) {
        console.error("[IPC:gift-md:process] Error:", error);
        throw error;
      }
    },
  );
}
