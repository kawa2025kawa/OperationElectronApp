import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { loadAuthSession, logout as logoutCommand } from "@shared/api/commands";
import type { AppState } from "@shared/store";
import type { AuthSession } from "@shared/types/authTypes";

export interface AuthSlice {
  isAuthenticated: boolean;
  isChecking: boolean;
  isLoginProcessing: boolean;
  accessToken: string | null;

  setIsAuthenticated: (auth: boolean) => void;
  setIsChecking: (check: boolean) => void;
  setIsLoginProcessing: (proc: boolean) => void;
  setAccessToken: (token: string | null) => void;

  checkAuthStatus: () => Promise<boolean>;
  handleLoginSuccess: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const createAuthSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  AuthSlice
> = (set, get) => ({
  isAuthenticated: false,
  isChecking: false,
  isLoginProcessing: false,
  accessToken: null,

  setIsAuthenticated: (auth) =>
    set((state: AppState) => {
      state.isAuthenticated = auth;
    }),

  setIsChecking: (check) =>
    set((state: AppState) => {
      state.isChecking = check;
    }),

  setIsLoginProcessing: (proc) =>
    set((state: AppState) => {
      state.isLoginProcessing = proc;
    }),

  setAccessToken: (token) =>
    set((state: AppState) => {
      state.accessToken = token;
    }),

  checkAuthStatus: async () => {
    get().setIsChecking(true);

    try {
      const session: AuthSession | null = await loadAuthSession();

      if (!session?.accessToken) {
        get().setIsAuthenticated(false);
        get().setAccessToken(null);

        return false;
      }

      get().setAccessToken(session.accessToken);
      get().setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error("[Auth] Session check failed:", error);

      get().setIsAuthenticated(false);
      get().setAccessToken(null);

      return false;
    } finally {
      get().setIsChecking(false);
    }
  },

  handleLoginSuccess: async (accessToken) => {
    get().setAccessToken(accessToken);
    get().setIsAuthenticated(true);
    get().setIsLoginProcessing(false);

    toast.success("Googleログインに成功しました");

    void get().prefetchSheets(accessToken);

    const pendingView = get().pendingView;

    if (pendingView) {
      get().setCurrentView(pendingView);
      get().setPendingView(null);
    }
  },

  logout: async () => {
    try {
      await logoutCommand();

      set((state: AppState) => {
        state.isAuthenticated = false;
        state.isChecking = false;
        state.isLoginProcessing = false;
        state.accessToken = null;
        state.pendingView = null;
      });

      toast.success("ログアウトしました");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);

      toast.error(error instanceof Error ? error.message : "ログアウト失敗");
    }
  },
});
