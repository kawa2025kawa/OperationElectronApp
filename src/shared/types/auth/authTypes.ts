//src\shared\types\auth\authTypes.ts

export interface OAuthToken {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  idToken: string | null;
}

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

export interface AuthProfile {
  email: string | null;
  familyName: string | null;
}

export type AuthState = "loading" | "loggedIn" | "loggedOut";

export interface AuthSliceState {
  isAuthenticated: boolean;
  isChecking: boolean;
  accessToken: string | null;
  userEmail: string | null;
  familyName: string | null;
}

export interface AuthSliceActions {
  setIsAuthenticated: (auth: boolean) => void;
  setIsChecking: (check: boolean) => void;
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

export type AuthSlice = AuthSliceState & AuthSliceActions;
