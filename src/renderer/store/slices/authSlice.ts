// src/renderer/store/slices/authSlice.ts

import type { StateCreator } from "zustand";
import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import type { AppState } from "@renderer/store";
import type { AuthProfile, AuthSlice } from "@shared/types/auth/authTypes";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

// 認証状態を未認証に戻す。
function clearAuthState(state: AppState): void {
  state.isAuthenticated = false;
  state.isChecking = false;
  state.userEmail = null;
  state.familyName = null;
}

// 認証プロフィールを状態に反映する。
function applyAuthState(state: AppState, profile: AuthProfile): void {
  state.isAuthenticated = true;
  state.userEmail = profile.email;
  state.familyName = profile.familyName;
}

export type { AuthSlice } from "@shared/types/auth/authTypes";

// 認証状態と認証操作を管理するスライス。
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

  login: async (): Promise<boolean> => {
    try {
      const profile = await window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGIN);

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

  checkAuthStatus: async (forceRefresh = false): Promise<boolean> => {
    set((state) => {
      state.isChecking = true;
    });

    try {
      const profile = await window.electronAPI.invoke(
        IPC_CHANNELS.AUTH.LOAD_SESSION,
        forceRefresh,
      );

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

  logout: async (): Promise<void> => {
    try {
      await window.electronAPI.invoke(IPC_CHANNELS.AUTH.LOGOUT);
    } catch (error) {
      console.error("[Auth] Logout command failed:", error);
      throw error;
    } finally {
      set((state) => {
        clearAuthState(state);
      });

      get().setCurrentView(APP_VIEW_IDS.AUTH);
    }
  },
});
