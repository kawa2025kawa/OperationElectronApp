// src/shared/types/auth/authTypes.ts

/**
- Rendererへ公開する認証プロフィール。
 */
export interface AuthProfile {
  email: string | null;
  familyName: string | null;
}