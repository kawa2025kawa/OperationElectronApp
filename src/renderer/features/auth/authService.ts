// src/renderer/services/authService.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AuthProfile } from "@shared/types/auth/authTypes";

/**
 * 認証関連（ログイン・ログアウト・セッション確認）の IPC 通信を集約するサービス
 */
export const authService = {
  /**
   * Google認証ログイン処理を実行し、プロファイルを取得する
   */
  login: (): Promise<AuthProfile | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGIN),

  /**
   * 現在の認証セッションをロードし、プロファイルを取得する
   * @param forceRefresh 強制リフレッシュを行うかどうか
   */
  loadSession: (forceRefresh = false): Promise<AuthProfile | null> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOAD_SESSION, forceRefresh),

  /**
   * ログアウト処理を実行し、セッションを破棄する
   */
  logout: (): Promise<void> =>
    window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGOUT),
};
