// electron/features/auth/oauthClient.ts

import { app } from "electron";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { OAuth2Client } from "google-auth-library";
import type { GoogleUserInfo, OAuthToken } from "@shared/types/auth";

const GOOGLE_AUTH_CONFIG = {
  credentialFileName: "google-oauth-credentials.json",
  userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
} as const;

interface GoogleCredentials {
  clientId: string;
  clientSecret?: string;
}

export interface GoogleUserProfile {
  email: string | null;
  familyName: string | null;
}

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 認証情報ファイルのパスを取得する
function getCredentialsFilePath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, GOOGLE_AUTH_CONFIG.credentialFileName)
    : path.join(
        process.cwd(),
        "resources",
        GOOGLE_AUTH_CONFIG.credentialFileName,
      );
}

// Google OAuth の認証情報ファイルを読み込み、client ID と任意の client secret を返す
function getGoogleCredentials(): GoogleCredentials {
  const filePath = getCredentialsFilePath();

  if (!existsSync(filePath)) {
    throw new Error(`Google OAuth credentials not found: ${filePath}`);
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);

    if (!isJsonObject(parsed)) {
      throw new Error("Invalid Google OAuth credentials format");
    }

    const config = parsed.installed ?? parsed.web;

    if (!isJsonObject(config)) {
      throw new Error('Credentials must contain "installed" or "web" config');
    }

    const clientId =
      typeof config.client_id === "string" ? config.client_id.trim() : "";

    if (!clientId) {
      throw new Error("Google OAuth client_id not found");
    }

    const clientSecret =
      typeof config.client_secret === "string"
        ? config.client_secret.trim() || undefined
        : undefined;

    return {
      clientId,
      clientSecret,
    };
  } catch (error) {
    throw new Error(
      `Failed to load Google OAuth credentials: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

// OAuthクライアントを生成する
export function createOAuthClient(redirectUri?: string): OAuth2Client {
  const credentials = getGoogleCredentials();

  return new OAuth2Client({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri,
  });
}

// Google OAuthの認証情報をアプリ内のトークン形式に変換する
function toOAuthToken(credentials: OAuth2Client["credentials"]): OAuthToken {
  if (!credentials.access_token) {
    throw new Error("Google OAuth access_token not found");
  }

  return {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token ?? null,
    expiresIn: credentials.expiry_date
      ? Math.max(0, Math.floor((credentials.expiry_date - Date.now()) / 1000))
      : null,
    idToken: credentials.id_token ?? null,
  };
}

// 認可コードをトークンに交換する
export async function exchangeAuthorizationCode(
  client: OAuth2Client,
  code: string,
  codeVerifier: string,
): Promise<OAuthToken> {
  const { tokens } = await client.getToken({
    code,
    codeVerifier,
  });

  return toOAuthToken(tokens);
}

// リフレッシュトークンからアクセストークンを更新する
export async function refreshAccessToken(
  refreshToken: string,
): Promise<OAuthToken> {
  const client = createOAuthClient();

  client.setCredentials({ refresh_token: refreshToken });
  await client.getAccessToken();

  return toOAuthToken(client.credentials);
}

// OAuthエラーがinvalid_grantか判定する
export function isInvalidGrantError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const response = (
    error as {
      response?: {
        data?: {
          error?: unknown;
        };
      };
    }
  ).response;

  return response?.data?.error === "invalid_grant";
}

// Google UserInfo APIからプロフィールを取得する
export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserProfile> {
  try {
    const response = await fetch(GOOGLE_AUTH_CONFIG.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `[AuthService] UserInfo API failed with status: ${response.status}`,
      );

      return { email: null, familyName: null };
    }

    const userInfo = (await response.json()) as GoogleUserInfo;

    return {
      email: userInfo.email?.trim() || null,
      familyName: userInfo.family_name?.trim() || null,
    };
  } catch (error) {
    console.error("[AuthService] Failed to fetch user info:", error);

    return { email: null, familyName: null };
  }
}
