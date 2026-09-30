// src/shared/types/auth/authTypes.ts

export interface OAuthToken {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  idToken: string | null;
}

/**
 * Main process内部でのみ使用するGoogle認証セッション。
 *
 * accessToken / refreshTokenはRendererへ返さない。
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  email: string | null;
  familyName: string | null;
}

export interface GoogleUserInfo {
  email?: string;
  family_name?: string;
}

/**
 * Rendererへ公開する認証プロフィール。
 */
export interface AuthProfile {
  email: string | null;
  familyName: string | null;
}

export type AuthState = "loading" | "loggedIn" | "loggedOut";

export interface AuthSliceState {
  isAuthenticated: boolean;
  isChecking: boolean;
  userEmail: string | null;
  familyName: string | null;
}

export interface AuthSliceActions {
  setIsAuthenticated: (auth: boolean) => void;
  setIsChecking: (check: boolean) => void;
  setUserEmail: (email: string | null) => void;
  setFamilyName: (familyName: string | null) => void;

  checkAuthStatus: (forceRefresh?: boolean) => Promise<boolean>;

  handleLoginSuccess: (
    email?: string | null,
    familyName?: string | null,
  ) => Promise<void>;

  logout: () => Promise<void>;
}

export type AuthSlice = AuthSliceState & AuthSliceActions;
