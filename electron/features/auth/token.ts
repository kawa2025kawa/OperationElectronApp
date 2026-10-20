// electron/features/auth/token.ts

import { app, safeStorage } from "electron";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AuthSession, OAuthToken } from "@shared/types/auth";

const TOKEN_FILE_NAME = "google-oauth-session.dat";

// 暗号化された認証セッションの保存先パスを取得する。
function getTokenFilePath(): string {
  return path.join(app.getPath("userData"), TOKEN_FILE_NAME);
}

// OAuth トークンとプロフィール情報をアプリ内部の認証セッション形式に変換する。
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

// トークンとプロフィール情報を暗号化してローカルに保存する。
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

// 保存済みセッションのプロフィール情報を更新し、暗号化して再保存する。
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

// 暗号化されたセッションを読み込み、内容を検証して AuthSession として返す。
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

// 保存済みセッションファイルを削除する。
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

// セッションの有効期限と現在時刻を比較し、トークンの期限切れを判定する。
export function isTokenExpired(session: AuthSession): boolean {
  return session.expiresAt !== null && Date.now() >= session.expiresAt;
}
