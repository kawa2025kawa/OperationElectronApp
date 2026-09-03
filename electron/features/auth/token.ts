// electron/features/auth/token.ts

import keytar from "keytar";

import type { AuthSession, OAuthToken } from "@shared/types/auth";

// =====================================================
// Constants
// =====================================================

const SERVICE_NAME = "OperationApp_GoogleOAuth";
const ACCOUNT_NAME = "session";

// =====================================================
// Token → Session
// =====================================================

function tokenToSession(token: OAuthToken): AuthSession {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt:
      token.expiresIn !== null ? Date.now() + token.expiresIn * 1000 : null,
    email: null,
    familyName: null,
  };
}

// =====================================================
// Save
// =====================================================

export async function saveToken(token: OAuthToken): Promise<AuthSession> {
  const session = tokenToSession(token);

  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(session));

  return session;
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
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (typeof parsed.accessToken !== "string" || !parsed.accessToken.trim()) {
      throw new Error("Stored session does not contain a valid accessToken");
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      expiresAt: parsed.expiresAt ?? null,
      email: parsed.email ?? null,
      familyName: parsed.familyName ?? null,
    };
  } catch (error) {
    console.error("[GoogleOAuth] Invalid stored session", error);

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
  return session.expiresAt !== null && Date.now() >= session.expiresAt;
}
