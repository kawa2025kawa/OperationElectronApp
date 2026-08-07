// electron/handlers/statusHandlers.ts

import { ipcMain } from "electron";

import { initializeStatuses } from "../services/statusManager";

export function setupStatusHandlers(): void {
  ipcMain.handle("initializeStatuses", async () => {
    console.log("[IPC] initializeStatuses");

    try {
      const statuses = await initializeStatuses();

      return {
        success: true,
        data: statuses,
      };
    } catch (error) {
      console.error("[initializeStatuses] failed", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
