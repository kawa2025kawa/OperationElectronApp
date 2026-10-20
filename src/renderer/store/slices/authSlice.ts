// src/renderer/store/slices/authSlice.ts

import type { StateCreator } from "zustand";
import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import type { AppState } from "@renderer/store";
import type { AuthProfile, AuthSlice } from "@shared/types/auth/authTypes";
import { authService } from "@renderer/features/auth/authService";

// 認証ステートを初期未認証状態にクリアする。
function clearAuthState(state: AppState): void {
  state.isAuthenticated = false;
  state.isChecking = false;
  state.userEmail = null;
  state.familyName = null;
}

// 認証プロファイル情報をストアのステートに適用する。
function applyAuthState(state: AppState, profile: AuthProfile): void {
  state.isAuthenticated = true;
  state.userEmail = profile.email;
  state.familyName = profile.familyName;
}

export type { AuthSlice } from "@shared/types/auth/authTypes";

// 認証状態とログイン・ログアウト操作を管理する認証スライスを生成する。
export const createAuthSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set, get) => ({
  isAuthenticated: false,
  isChecking: false,
  userEmail: null,
  familyName: null,

  // Google認証ログイン処理を実行し、結果をステートに反映する。
  login: async (): Promise<boolean> => {
    try {
      const profile = await authService.login();
      if (!profile) {
        set((state) => {
          clearAuthState(state);
        });
        return false;
      }

      set((state) => {
        applyAuthState(state, profile);
      });
      return true;
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      set((state) => {
        clearAuthState(state);
      });
      throw error;
    }
  },

  // 現在の認証セッション状態を確認し、ストアを同期する。
  checkAuthStatus: async (forceRefresh = false): Promise<boolean> => {
    set((state) => {
      state.isChecking = true;
    });

    try {
      const profile = await authService.loadSession(forceRefresh);
      if (!profile) {
        set((state) => {
          clearAuthState(state);
        });
        return false;
      }

      set((state) => {
        applyAuthState(state, profile);
      });
      return true;
    } catch (error) {
      console.error("[Auth] Session check failed:", error);
      set((state) => {
        clearAuthState(state);
      });
      return false;
    } finally {
      set((state) => {
        state.isChecking = false;
      });
    }
  },

  // ログアウト処理を実行し、ステートを初期化して認証画面へ遷移する。
  logout: async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("[Auth] Logout command failed:", error);
    } finally {
      set((state) => {
        clearAuthState(state);
      });
      get().setCurrentView(APP_VIEW_IDS.AUTH);
    }
  },
});
