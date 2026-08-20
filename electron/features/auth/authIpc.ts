// electron/features/auth/authIpc.ts

import { ipcMain } from "electron";

import { GoogleOAuthService } from "../spreadsheet/googleOAuthService";

const authService = new GoogleOAuthService();

let registered = false;

export function registerAuthIpc(): void {
  if (registered) {
    console.warn("[IPC] Auth handlers already registered.");
    return;
  }

  registered = true;

  ipcMain.handle("googleAuth:login", async () => {
    return authService.login();
  });

  ipcMain.handle("googleAuth:loadSession", async () => {
    return authService.loadSession();
  });

  ipcMain.handle("googleAuth:logout", async () => {
    return authService.clearSession();
  });

  console.log("[IPC] Auth handlers registered.");
}
