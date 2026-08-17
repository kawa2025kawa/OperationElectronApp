// electron/features/auth/authIpc.ts
import { ipcMain } from "electron";
import { GoogleOAuthService } from "@electron/features/spreadsheet/googleOAuthService";

const authService = new GoogleOAuthService();

export function registerAuthIpc(): void {
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
