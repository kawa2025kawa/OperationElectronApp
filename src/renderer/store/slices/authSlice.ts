// src/renderer/store/slices/authSlice.ts

import type { StateCreator } from "zustand";
import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import { appService } from "@renderer/services/appService";
import { authIpcService } from "@renderer/services/ipcServices";
import type { AppState } from "@renderer/store";
import type { AuthProfile } from "@shared/types/auth/authTypes";

export type AuthState = "loading" | "loggedIn" | "loggedOut";

interface AuthSliceState {
  isAuthenticated: boolean;
  isChecking: boolean;
  userEmail: string | null;
  familyName: string | null;
}

interface AuthSliceActions {
  login: () => Promise<boolean>;
  checkAuthStatus: (forceRefresh?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

export type AuthSlice = AuthSliceState & AuthSliceActions;

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

// 認証状態と認証操作を管理するスライス。
export const createAuthSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set, get) => {
  let isAuthTransitioning = false;

  return {
    isAuthenticated: false,
    isChecking: false,
    userEmail: null,
    familyName: null,

    login: async (): Promise<boolean> => {
      if (isAuthTransitioning) return false;
      isAuthTransitioning = true;

      try {
        const profile = await authIpcService.login();

        set((state) => {
          applyAuthState(state, profile);
        });

        get().setInitStatus({ auth: "OK" });
        await appService.loadOperationData();

        return true;
      } catch (error) {
        console.error("[Auth] Login failed:", error);

        set((state) => {
          clearAuthState(state);
        });

        throw error;
      } finally {
        isAuthTransitioning = false;
      }
    },

    checkAuthStatus: async (forceRefresh = false): Promise<boolean> => {
      set((state) => {
        state.isChecking = true;
      });

      try {
        const profile = await authIpcService.loadSession(forceRefresh);

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
      if (isAuthTransitioning) return;
      isAuthTransitioning = true;

      try {
        await authIpcService.logout();
      } catch (error) {
        console.error("[Auth] Logout command failed:", error);
        throw error;
      } finally {
        isAuthTransitioning = false;

        set((state) => {
          clearAuthState(state);
        });

        get().clearMasterData();
        get().resetOperationRuntimeState();
        get().resetStatusSummaryState();
        get().setCurrentView(APP_VIEW_IDS.AUTH);
      }
    },
  };
};