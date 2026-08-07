import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store/index";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

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

  setIsAuthenticated: (auth) => set((s) => { s.isAuthenticated = auth; }),
  setIsChecking: (check) => set((s) => { s.isChecking = check; }),
  setIsLoginProcessing: (proc) => set((s) => { s.isLoginProcessing = proc; }),
  setAccessToken: (token) => set((s) => { s.accessToken = token; }),

  checkAuthStatus: async () => {
    get().setIsChecking(true);
    try {
      const session = await window.electronAPI.invoke<AuthSession | null>("googleAuth:loadSession");
      if (!session?.accessToken) {
        await get().logout();
        return false;
      }
      get().setAccessToken(session.accessToken);
      get().setIsAuthenticated(true);
      return true;
    } catch {
      get().setIsAuthenticated(false);
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
      await window.electronAPI.invoke("googleAuth:logout");
      set((s) => {
        Object.assign(s, {
          isAuthenticated: false,
          isChecking: false,
          isLoginProcessing: false,
          accessToken: null,
          pendingView: null,
        });
      });
      toast.success("ログアウトしました");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ログアウト失敗");
    }
  },
});
