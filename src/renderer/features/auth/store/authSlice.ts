// src/renderer/features/auth/store/authSlice.ts

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
  userEmail: string | null;
  familyName: string | null;

  setIsAuthenticated: (auth: boolean) => void;
  setIsChecking: (check: boolean) => void;
  setIsLoginProcessing: (proc: boolean) => void;
  setAccessToken: (token: string | null) => void;
  setUserEmail: (email: string | null) => void;
  setFamilyName: (familyName: string | null) => void;

  checkAuthStatus: () => Promise<boolean>;
  handleLoginSuccess: (
    token: string,
    email?: string | null,
    familyName?: string | null,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

interface GoogleUserInfo {
  email?: string;
  family_name?: string;
}

/**
 * アクセストークンから Google UserInfo API を呼び出して
 * メールアドレスと姓（family_name）を取得するヘルパー関数
 */
async function fetchUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.warn(`[Auth] Failed to fetch Google user info: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as GoogleUserInfo;

    return data;
  } catch (error) {
    console.error("[Auth] Failed to fetch Google user info:", error);
    return null;
  }
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
  userEmail: null,
  familyName: null,

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

  setUserEmail: (email) =>
    set((state: AppState) => {
      state.userEmail = email;
    }),

  setFamilyName: (familyName) =>
    set((state: AppState) => {
      state.familyName = familyName;
    }),

  checkAuthStatus: async () => {
    get().setIsChecking(true);

    try {
      const session: AuthSession | null = await loadAuthSession();

      if (!session?.accessToken) {
        get().setIsAuthenticated(false);
        get().setAccessToken(null);
        get().setUserEmail(null);
        get().setFamilyName(null);

        return false;
      }

      get().setAccessToken(session.accessToken);
      get().setIsAuthenticated(true);

      /*
       * セッションに email / familyName が含まれていればそれを使用。
       * 含まれていない場合は Google UserInfo API から取得する。
       */
      const userInfo =
        session.email !== undefined && session.familyName !== undefined
          ? {
              email: session.email,
              family_name: session.familyName,
            }
          : await fetchUserInfo(session.accessToken);

      get().setUserEmail(
        session.email !== undefined ? session.email : (userInfo?.email ?? null),
      );

      get().setFamilyName(
        session.familyName !== undefined
          ? session.familyName
          : (userInfo?.family_name ?? null),
      );

      return true;
    } catch (error) {
      console.error("[Auth] Session check failed:", error);

      get().setIsAuthenticated(false);
      get().setAccessToken(null);
      get().setUserEmail(null);
      get().setFamilyName(null);

      return false;
    } finally {
      get().setIsChecking(false);
    }
  },

  handleLoginSuccess: async (accessToken, emailParam, familyNameParam) => {
    get().setAccessToken(accessToken);
    get().setIsAuthenticated(true);
    get().setIsLoginProcessing(false);

    /*
     * ログイン時に引数としてプロフィール情報が渡されていれば使用。
     * なければ Google UserInfo API から取得する。
     */
    const userInfo =
      emailParam !== undefined && familyNameParam !== undefined
        ? {
            email: emailParam,
            family_name: familyNameParam,
          }
        : await fetchUserInfo(accessToken);

    const email =
      emailParam !== undefined ? emailParam : (userInfo?.email ?? null);

    const familyName =
      familyNameParam !== undefined
        ? familyNameParam
        : (userInfo?.family_name ?? null);

    get().setUserEmail(email);
    get().setFamilyName(familyName);

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
        state.userEmail = null;
        state.familyName = null;
        state.pendingView = null;
      });

      toast.success("ログアウトしました");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);

      toast.error(error instanceof Error ? error.message : "ログアウト失敗");
    }
  },
});
