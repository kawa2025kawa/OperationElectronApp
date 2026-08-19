// src/shared/types/authTypes.ts

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
  email?: string | null;
  familyName?: string | null;
}
