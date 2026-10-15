// electron/ipc/authIpc.ts

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { authService } from "@electron/features/auth/authService";
import type { AuthProfile, AuthSession } from "@shared/types/auth";

function toPublicProfile(session: AuthSession | null): AuthProfile | null {
  if (!session) {
    return null;
  }
  return {
    email: session.email,
    familyName: session.familyName,
  };
}

export function registerAuthIpc(): void {
  ipcMain.handle(IPC_CHANNELS.AUTH.LOGIN, async (): Promise<AuthProfile> => {
    const session = await authService.login();
    const profile = toPublicProfile(session);
    if (!profile) {
      throw new Error("ログインセッションの取得に失敗しました");
    }
    return profile;
  });

  ipcMain.handle(
    IPC_CHANNELS.AUTH.LOAD_SESSION,
    async (_event, forceRefresh?: boolean): Promise<AuthProfile | null> => {
      const session = await authService.loadSession(forceRefresh);
      return toPublicProfile(session);
    },
  );

  ipcMain.handle(IPC_CHANNELS.AUTH.LOGOUT, async (): Promise<void> => {
    await authService.clearSession();
  });
}
