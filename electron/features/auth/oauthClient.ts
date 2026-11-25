// electron/features/auth/oauthClient.ts

import * as http from "node:http";
import fs from "fs-extra";
import { OAuth2Client } from "google-auth-library";
import { resolveResourcePath } from "@electron/features/system/systemService";
import type { OAuthToken } from "@shared/types/auth/authTypes";

export const OAUTH_CONFIG = {
  host: "127.0.0.1",
  port: 8888,
  defaultTimeoutMs: 60000,
  credentialFileName: "google-oauth-credentials.json",
} as const;

interface GoogleCredentials {
  clientId: string;
  clientSecret?: string;
}

type JsonObject = Record<string, unknown>;

let cachedCredentials: GoogleCredentials | null = null;
let activeListener: ((error: Error) => void) | null = null;

const createHtml = (title: string, message: string): string =>
  `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>${title}</title></head><body><h1>${title}</h1><p>${message}</p></body></html>`;

const HTML_SUCCESS = createHtml(
  "認証完了",
  "Google ログインが完了しました。このウィンドウを閉じてアプリに戻ってください。",
);
const HTML_ERROR = createHtml(
  "認証エラー",
  "Google ログインでエラーが発生しました。アプリからやり直してください。",
);
const HTML_INVALID = createHtml("不正なリクエスト", "無効なリクエストです。");

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getGoogleCredentials(): GoogleCredentials {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const filePath = resolveResourcePath(OAUTH_CONFIG.credentialFileName);
  if (!fs.pathExistsSync(filePath)) {
    throw new Error(`Google OAuth credentials not found: ${filePath}`);
  }

  try {
    const parsed: unknown = fs.readJsonSync(filePath);

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

    cachedCredentials = { clientId, clientSecret };
    return cachedCredentials;
  } catch (error) {
    throw new Error(
      `Failed to load Google OAuth credentials: ${formatErrorMessage(error)}`,
      { cause: error },
    );
  }
}

export function createOAuthClient(redirectUri?: string): OAuth2Client {
  const credentials = getGoogleCredentials();

  return new OAuth2Client({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri,
  });
}

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
  };
}

export async function exchangeAuthorizationCode(
  client: OAuth2Client,
  code: string,
  codeVerifier: string,
): Promise<OAuthToken> {
  const { tokens } = await client.getToken({ code, codeVerifier });
  return toOAuthToken(tokens);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<OAuthToken> {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  await client.getAccessToken();
  return toOAuthToken(client.credentials);
}

export function isInvalidGrantError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const response = (
    error as { response?: { data?: { error?: unknown } } }
  ).response;

  return response?.data?.error === "invalid_grant";
}

export function startOAuthListener(
  expectedState: string,
  onListening?: () => void | Promise<void>,
  timeoutMs: number = OAUTH_CONFIG.defaultTimeoutMs,
): Promise<string> {
  activeListener?.(new Error("OAuth listener was replaced"));

  const { host, port } = OAUTH_CONFIG;

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: NodeJS.Timeout | null = null;

    const server = http.createServer((req, res) => {
      if (settled) {
        res.writeHead(410, { "Cache-Control": "no-store" });
        res.end();
        return;
      }

      if (req.method !== "GET") {
        rejectRequest(res, 405, HTML_INVALID, "OAuth callback must use GET");
        return;
      }

      const url = new URL(req.url ?? "/", `http://${host}:${port}`);
      const error = url.searchParams.get("error");
      if (error) {
        rejectRequest(res, 400, HTML_ERROR, `Google OAuth error: ${error}`);
        return;
      }

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state || state !== expectedState) {
        rejectRequest(
          res,
          400,
          HTML_INVALID,
          "Invalid OAuth callback parameters or state mismatch",
        );
        return;
      }

      respond(res, 200, HTML_SUCCESS);
      succeed(code);
    });

    const cleanup = (): void => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (activeListener === fail) {
        activeListener = null;
      }
      if (server.listening) {
        server.close();
      }
    };

    const succeed = (code: string): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(code);
    };

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const respond = (
      res: http.ServerResponse,
      status: number,
      body: string,
    ): void => {
      res.writeHead(status, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(body);
    };

    const rejectRequest = (
      res: http.ServerResponse,
      status: number,
      body: string,
      reason: string,
    ): void => {
      respond(res, status, body);
      fail(new Error(reason));
    };

    activeListener = fail;

    timer = setTimeout(() => {
      fail(new Error("Google OAuth ログインがタイムアウトしました"));
    }, timeoutMs);

    server.once("error", (error) => {
      fail(new Error(`OAuth listener error: ${error.message}`));
    });

    server.listen(port, host, () => {
      if (!onListening) return;

      void Promise.resolve()
        .then(onListening)
        .catch((error: unknown) => {
          fail(error instanceof Error ? error : new Error(String(error)));
        });
    });
  });
}
