// electron/handlers/authHandlers.ts

import { ipcMain } from "electron";
import { GoogleOAuthService } from "../services/GoogleOAuthService";

const authService = new GoogleOAuthService();

export function setupAuthHandlers(): void {
  /**
   * Googleログイン
   */
  ipcMain.handle("googleAuth:login", () => authService.login());

  /**
   * 保存済みセッション取得
   *
   * 起動時チェック用
   */
  ipcMain.handle("googleAuth:loadSession", async () => {
    const session = await authService.loadSession();

    if (!session) {
      return null;
    }

    if (Date.now() >= session.expiresAt) {
      const newToken = await authService.refreshAccessToken();

      if (!newToken) {
        return null;
      }

      return {
        ...session,
        accessToken: newToken,
      };
    }

    return session;
  });

  /**
   * ログアウト
   */
  ipcMain.handle("googleAuth:logout", () => authService.clearSession());

  /**
   * Token再取得
   */
  ipcMain.handle("googleAuth:refreshToken", () =>
    authService.refreshAccessToken(),
  );

  console.log("[IPC] auth handlers registered");
}
