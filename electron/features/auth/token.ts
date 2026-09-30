// electron/features/auth/token.ts

import { app, safeStorage } from "electron";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AuthSession, OAuthToken } from "@shared/types/auth";

const TOKEN_FILE_NAME = "google-oauth-session.dat";

function getTokenFilePath(): string {
  return path.join(app.getPath("userData"), TOKEN_FILE_NAME);
}

function tokenToSession(
  token: OAuthToken,
  profile?: Pick<AuthSession, "email" | "familyName">,
): AuthSession {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt:
      token.expiresIn !== null ? Date.now() + token.expiresIn * 1000 : null,
    email: profile?.email ?? null,
    familyName: profile?.familyName ?? null,
  };
}

export async function saveToken(
  token: OAuthToken,
  profile?: Pick<AuthSession, "email" | "familyName">,
): Promise<AuthSession> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Electron safeStorage encryption is not available");
  }

  const session = tokenToSession(token, profile);

  console.log("[GoogleOAuth] Saving session:", {
    hasAccessToken: Boolean(session.accessToken),
    hasRefreshToken: Boolean(session.refreshToken),
    expiresAt: session.expiresAt,
  });

  const encrypted = safeStorage.encryptString(JSON.stringify(session));

  writeFileSync(getTokenFilePath(), encrypted);

  console.log("[GoogleOAuth] Session saved");

  return session;
}

export async function updateTokenProfile(
  profile: Pick<AuthSession, "email" | "familyName">,
): Promise<AuthSession | null> {
  const session = await loadToken();

  if (!session) {
    return null;
  }

  const updatedSession: AuthSession = {
    ...session,
    email: profile.email,
    familyName: profile.familyName,
  };

  const encrypted = safeStorage.encryptString(JSON.stringify(updatedSession));

  writeFileSync(getTokenFilePath(), encrypted);

  console.log("[GoogleOAuth] Session profile updated");

  return updatedSession;
}

export async function loadToken(): Promise<AuthSession | null> {
  const filePath = getTokenFilePath();

  if (!existsSync(filePath)) {
    console.log("[GoogleOAuth] No stored session");
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    console.error(
      "[GoogleOAuth] Electron safeStorage encryption is not available",
    );
    return null;
  }

  try {
    const encrypted = readFileSync(filePath);
    const raw = safeStorage.decryptString(encrypted);
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (typeof parsed.accessToken !== "string" || !parsed.accessToken.trim()) {
      throw new Error("Stored session does not contain a valid accessToken");
    }

    const session: AuthSession = {
      accessToken: parsed.accessToken,
      refreshToken:
        typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
      expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : null,
      email: typeof parsed.email === "string" ? parsed.email : null,
      familyName:
        typeof parsed.familyName === "string" ? parsed.familyName : null,
    };

    console.log("[GoogleOAuth] Stored session loaded:", {
      hasAccessToken: Boolean(session.accessToken),
      hasRefreshToken: Boolean(session.refreshToken),
      expiresAt: session.expiresAt,
      expired: isTokenExpired(session),
    });

    return session;
  } catch (error) {
    console.error("[GoogleOAuth] Failed to load stored session:", error);

    await clearToken();

    return null;
  }
}

export async function clearToken(): Promise<void> {
  const filePath = getTokenFilePath();

  if (!existsSync(filePath)) {
    return;
  }

  try {
    unlinkSync(filePath);
    console.log("[GoogleOAuth] Stored session cleared");
  } catch (error) {
    console.error("[GoogleOAuth] Failed to clear stored session:", error);
  }
}

export function isTokenExpired(session: AuthSession): boolean {
  return session.expiresAt !== null && Date.now() >= session.expiresAt;
}
