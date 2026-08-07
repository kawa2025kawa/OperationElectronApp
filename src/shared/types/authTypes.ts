// src/shared/types/authTypes.ts

export interface OAuthToken {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  idToken: string | null;
}

export interface StoredToken {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: GoogleUser;
}
