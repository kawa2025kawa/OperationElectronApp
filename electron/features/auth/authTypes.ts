// electron/features/auth/authTypes.ts

export interface OAuthToken {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
}

/**
- Main process内部でのみ使用するGoogle認証セッション。
- accessToken / refreshTokenはRendererへ返さない。
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  email: string | null;
  familyName: string | null;
}
