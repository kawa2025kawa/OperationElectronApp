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
  login: () => Promise<boolean>;
  checkAuthStatus: (forceRefresh?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

export type AuthSlice = AuthSliceState & AuthSliceActions;
