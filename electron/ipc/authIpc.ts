// electron/ipc/authIpc.ts

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { authService } from "@electron/features/auth/authService";
import type { AuthProfile, AuthSession } from "@shared/types/auth";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

// 認証セッションから外部公開に必要なプロフィール情報だけを抽出する
function toPublicProfile(session: AuthSession | null): AuthProfile | null {
  if (!session) {
    return null;
  }

  return {
    email: session.email,
    familyName: session.familyName,
  };
}

// ログイン・セッション取得・ログアウトに関するIPCハンドラーを登録する
export function registerAuthIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.AUTH.LOGIN,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.AUTH.LOGIN]["return"]
    > => {
      const session = await authService.login();
      const profile = toPublicProfile(session);

      if (!profile) {
        throw new Error("ログインセッションの取得に失敗しました");
      }

      return profile;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.AUTH.LOAD_SESSION,
    async (
      _event,
      forceRefresh?: IpcChannelMap[typeof IPC_CHANNELS.AUTH.LOAD_SESSION]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.AUTH.LOAD_SESSION]["return"]
    > => {
      const session = await authService.loadSession(forceRefresh);
      return toPublicProfile(session);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.AUTH.LOGOUT,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.AUTH.LOGOUT]["return"]
    > => {
      await authService.clearSession();
    },
  );
}
