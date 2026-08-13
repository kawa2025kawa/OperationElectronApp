// electron/handlers/statusHandlers.ts

import { ipcMain } from "electron";

import { initializeStatuses } from "../services/statusManager";

export function setupStatusHandlers(): void {
  ipcMain.handle("initializeStatus", async () => {
    return initializeStatuses();
  });
}
