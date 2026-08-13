// electron/handlers/authHandlers.ts

import { ipcMain } from "electron";

import { GoogleOAuthService } from "../services/GoogleOAuthService";

const authService = new GoogleOAuthService();

export function setupAuthHandlers(): void {
  ipcMain.handle("googleAuth:login", () => {
    return authService.login();
  });

  ipcMain.handle("googleAuth:loadSession", () => {
    return authService.loadSession();
  });

  ipcMain.handle("googleAuth:logout", () => {
    return authService.clearSession();
  });

  console.log("[IPC] auth handlers registered");
}
