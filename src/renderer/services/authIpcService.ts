// src/renderer/services/authIpcService.ts

import { IPC_CHANNELS } from "@shared/types/electron/ipcTypes";
import type { AuthProfile } from "@shared/types/auth/authTypes";

/**
 * Google OAuth 認証関連の IPC 通信を集約するサービス
 */
export const authIpcService = {
  /** Google OAuth ログインを実行する */
  login: (): Promise<AuthProfile> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGIN),

  /** 保存済みセッションを読み込む */
  loadSession: (forceRefresh = false): Promise<AuthProfile | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOAD_SESSION, forceRefresh),

  /** ログアウトを実行する */
  logout: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGOUT),
};
