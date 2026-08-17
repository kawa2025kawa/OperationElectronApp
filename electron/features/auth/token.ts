// electron/services/auth/token.ts

import keytar from "keytar";

import type { AuthSession, OAuthToken } from "@shared/types/authTypes";

// =====================================================
// Constants
// =====================================================

const SERVICE_NAME = "OperationApp_GoogleOAuth";
const ACCOUNT_NAME = "session";

// =====================================================
// Token → Session
// =====================================================

function createAuthSession(token: OAuthToken): AuthSession {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt:
      token.expiresIn !== null ? Date.now() + token.expiresIn * 1000 : null,
  };
}

// =====================================================
// Save
// =====================================================

export async function saveToken(token: OAuthToken): Promise<void> {
  const session = createAuthSession(token);

  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(session));
}

// =====================================================
// Load
// =====================================================

export async function loadToken(): Promise<AuthSession | null> {
  const raw = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch (error) {
    console.error("[GoogleOAuth] invalid stored session", error);

    await clearToken();

    return null;
  }
}

// =====================================================
// Clear
// =====================================================

export async function clearToken(): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
}

// =====================================================
// Expiration
// =====================================================

export function isTokenExpired(session: AuthSession): boolean {
  if (session.expiresAt === null) {
    return false;
  }

  return Date.now() >= session.expiresAt;
}
