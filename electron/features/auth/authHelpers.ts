// electron/features/auth/authHelpers.ts

import { app, safeStorage } from "electron";
import * as http from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AuthSession, OAuthToken } from "@shared/types/auth";

// ==========================================
// 1. credentials.ts の復元
// ==========================================
const CREDENTIAL_FILE = "google-oauth-credentials.json";

export interface GoogleCredentials {
  clientId: string;
  clientSecret?: string;
}

export function getGoogleCredentials(): GoogleCredentials {
  const filePath = app.isPackaged
    ? path.join(process.resourcesPath, CREDENTIAL_FILE)
    : path.join(process.cwd(), "resources", CREDENTIAL_FILE);

  if (!existsSync(filePath)) {
    throw new Error(`Google OAuth credentials not found: ${filePath}`);
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const config = json.installed ?? json.web;

    if (!config || typeof config !== "object") {
      throw new Error('Credentials must contain "installed" or "web" config');
    }

    const clientId =
      typeof config.client_id === "string" ? config.client_id.trim() : "";
    if (!clientId) {
      throw new Error("Google OAuth client_id not found");
    }

    const clientSecret =
      typeof config.client_secret === "string" && config.client_secret.trim()
        ? config.client_secret.trim()
        : undefined;

    return { clientId, clientSecret };
  } catch (error) {
    throw new Error(
      `Failed to load Google OAuth credentials: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

// ==========================================
// 2. oauth.ts の復元
// ==========================================
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;

interface GoogleTokenResponse {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  id_token?: unknown;
}

export interface PkceChallenge {
  verifier: string;
  challenge: string;
}

export function createPkce(): PkceChallenge {
  const verifier = randomBytes(32).toString("hex");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export function generateAuthUrl(
  clientId: string,
  redirectUri: string,
  challenge: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeToken(
  clientId: string,
  clientSecret: string | undefined,
  code: string,
  redirectUri: string,
  verifier: string,
): Promise<OAuthToken> {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }
  return sendTokenRequest(body, "Google token exchange failed");
}

export async function refreshToken(
  clientId: string,
  clientSecret: string | undefined,
  refreshTokenValue: string,
): Promise<OAuthToken> {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshTokenValue,
    grant_type: "refresh_token",
  });
  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }
  return sendTokenRequest(body, "Google token refresh failed");
}

function getOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

async function sendTokenRequest(
  body: URLSearchParams,
  errorMessagePrefix: string,
): Promise<OAuthToken> {
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
  } catch (error) {
    throw new Error(`${errorMessagePrefix}: network request failed`, {
      cause: error,
    });
  }
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `${errorMessagePrefix}: ${response.status} ${responseText}`,
    );
  }
  let token: GoogleTokenResponse;
  try {
    token = JSON.parse(responseText) as GoogleTokenResponse;
  } catch (error) {
    throw new Error(`${errorMessagePrefix}: invalid JSON response`, {
      cause: error,
    });
  }
  const accessToken = getOptionalString(token.access_token);
  if (!accessToken) {
    throw new Error(
      `${errorMessagePrefix}: response does not contain access_token`,
    );
  }
  return {
    accessToken,
    refreshToken: getOptionalString(token.refresh_token),
    expiresIn: getOptionalNumber(token.expires_in),
    idToken: getOptionalString(token.id_token),
  };
}

// ==========================================
// 3. listener.ts の復元
// ==========================================
export interface OAuthCallback {
  code: string;
  state: string;
}

const HOST = "127.0.0.1";
const DEFAULT_TIMEOUT_MS = 60000;

let activeServer: http.Server | null = null;

function stopListener(): void {
  if (activeServer) {
    activeServer.close();
    activeServer = null;
  }
}

const createHtmlPage = (title: string, message: string) =>
  `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body><h1>${title}</h1><p>${message}</p></body>
</html>`.trim();

const SUCCESS_RESPONSE = createHtmlPage(
  "認証完了",
  "Google ログインが完了しました。このウィンドウを閉じてアプリに戻ってください。",
);
const AUTH_ERROR_RESPONSE = createHtmlPage(
  "認証エラー",
  "Google ログインでエラーが発生しました。アプリからやり直してください。",
);
const INVALID_REQUEST_RESPONSE = createHtmlPage(
  "不正なリクエスト",
  "無効なリクエストです。",
);

export function startListener(
  port: number,
  expectedState: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<OAuthCallback> {
  stopListener();

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const server = http.createServer((req, res) => {
      void handleRequest(req, res);
    });
    activeServer = server;

    const closeAndCleanup = async () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (activeServer) {
        await new Promise<void>((r) => activeServer?.close(() => r()));
        activeServer = null;
      }
    };

    const respondAndSettle = async (
      res: http.ServerResponse,
      status: number,
      body: string,
      action: () => void,
    ) => {
      if (settled) return;
      settled = true;
      res.writeHead(status, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(body);
      await closeAndCleanup();
      action();
    };

    timer = setTimeout(async () => {
      if (settled) return;
      settled = true;
      await closeAndCleanup();
      reject(new Error("Google OAuth ログインがタイムアウトしました"));
    }, timeoutMs);

    async function handleRequest(
      req: http.IncomingMessage,
      res: http.ServerResponse,
    ) {
      if (req.method !== "GET") {
        return respondAndSettle(res, 405, INVALID_REQUEST_RESPONSE, () =>
          reject(new Error("OAuth callback must use GET")),
        );
      }

      const url = new URL(req.url ?? "/", `http://${HOST}:${port}`);
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (error) {
        return respondAndSettle(res, 400, AUTH_ERROR_RESPONSE, () =>
          reject(new Error(`Google OAuth error: ${error}`)),
        );
      }

      if (!code || !state || state !== expectedState) {
        return respondAndSettle(res, 400, INVALID_REQUEST_RESPONSE, () =>
          reject(
            new Error("Invalid OAuth callback parameters or state mismatch"),
          ),
        );
      }

      await respondAndSettle(res, 200, SUCCESS_RESPONSE, () =>
        resolve({ code, state }),
      );
    }

    server.once("error", async (err) => {
      if (settled) return;
      settled = true;
      await closeAndCleanup();
      reject(new Error(`OAuth listener error: ${err.message}`));
    });

    server.listen(port, HOST, () => {
      console.log(`[OAuthListener] Listening on http://${HOST}:${port}`);
    });
  });
}

// ==========================================
// 4. token.ts の復元
// ==========================================
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
