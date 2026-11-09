// electron/features/auth/token.ts

import { app, safeStorage } from "electron";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AuthSession, OAuthToken } from "@shared/types/auth";

const TOKEN_STORAGE_CONFIG = {
  fileName: "google-oauth-session.dat",
} as const;

let cachedSession: AuthSession | null = null;
let isSessionLoaded = false;
let sessionGeneration = 0;

export function getTokenGeneration(): number {
  return sessionGeneration;
}

function getTokenFilePath(): string {
  return path.join(app.getPath("userData"), TOKEN_STORAGE_CONFIG.fileName);
}

function assertGeneration(expectedGeneration?: number): void {
  if (
    expectedGeneration !== undefined &&
    expectedGeneration !== sessionGeneration
  ) {
    throw new Error("認証状態が変更されたため、セッションを保存できません");
  }
}

function persistSession(session: AuthSession): AuthSession {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Electron safeStorage encryption is not available");
  }

  writeFileSync(
    getTokenFilePath(),
    safeStorage.encryptString(JSON.stringify(session)),
  );

  cachedSession = session;
  isSessionLoaded = true;
  return { ...session };
}

function tokenToSession(
  token: OAuthToken,
  profile?: Pick<AuthSession, "email" | "familyName">,
): AuthSession {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt:
      typeof token.expiresIn === "number" && Number.isFinite(token.expiresIn)
        ? Date.now() + token.expiresIn * 1000
        : null,
    email: profile?.email ?? null,
    familyName: profile?.familyName ?? null,
  };
}

export async function saveToken(
  token: OAuthToken,
  profile?: Pick<AuthSession, "email" | "familyName">,
  expectedGeneration?: number,
): Promise<AuthSession> {
  assertGeneration(expectedGeneration);

  const session = persistSession(tokenToSession(token, profile));
  sessionGeneration++;

  console.log("[GoogleOAuth] Session saved:", {
    hasAccessToken: Boolean(session.accessToken),
    hasRefreshToken: Boolean(session.refreshToken),
    expiresAt: session.expiresAt,
  });

  return session;
}

export async function updateTokenProfile(
  profile: Pick<AuthSession, "email" | "familyName">,
  expectedAccessToken?: string,
  expectedGeneration?: number,
): Promise<AuthSession | null> {
  const session = await loadToken();

  if (
    !session ||
    (expectedGeneration !== undefined &&
      expectedGeneration !== sessionGeneration) ||
    (expectedAccessToken !== undefined &&
      expectedAccessToken !== session.accessToken)
  ) {
    return null;
  }

  assertGeneration(expectedGeneration);

  const updatedSession: AuthSession = {
    ...session,
    email: profile.email ?? session.email,
    familyName: profile.familyName ?? session.familyName,
  };

  const savedSession = persistSession(updatedSession);
  console.log("[GoogleOAuth] Session profile updated");
  return savedSession;
}

export async function loadToken(): Promise<AuthSession | null> {
  if (isSessionLoaded) {
    return cachedSession ? { ...cachedSession } : null;
  }

  const filePath = getTokenFilePath();
  if (!existsSync(filePath)) {
    cachedSession = null;
    isSessionLoaded = true;
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
    const parsed = JSON.parse(
      safeStorage.decryptString(encrypted),
    ) as Partial<AuthSession>;

    if (typeof parsed.accessToken !== "string" || !parsed.accessToken.trim()) {
      throw new Error("Stored session does not contain a valid accessToken");
    }

    const session: AuthSession = {
      accessToken: parsed.accessToken.trim(),
      refreshToken:
        typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
      expiresAt:
        typeof parsed.expiresAt === "number" &&
        Number.isFinite(parsed.expiresAt)
          ? parsed.expiresAt
          : null,
      email: typeof parsed.email === "string" ? parsed.email : null,
      familyName:
        typeof parsed.familyName === "string" ? parsed.familyName : null,
    };

    cachedSession = session;
    isSessionLoaded = true;

    console.log("[GoogleOAuth] Stored session loaded:", {
      hasAccessToken: Boolean(session.accessToken),
      hasRefreshToken: Boolean(session.refreshToken),
      expiresAt: session.expiresAt,
      expired: isTokenExpired(session),
    });

    return { ...session };
  } catch (error) {
    console.error("[GoogleOAuth] Failed to load stored session:", error);
    await clearToken();
    return null;
  }
}

export async function clearToken(expectedGeneration?: number): Promise<void> {
  assertGeneration(expectedGeneration);

  const filePath = getTokenFilePath();
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log("[GoogleOAuth] Stored session cleared");
    }
  } catch (error) {
    console.error("[GoogleOAuth] Failed to clear stored session:", error);
    throw error;
  }

  sessionGeneration++;
  cachedSession = null;
  isSessionLoaded = true;
}

export function isTokenExpired(session: AuthSession): boolean {
  return session.expiresAt !== null && Date.now() >= session.expiresAt;
}
