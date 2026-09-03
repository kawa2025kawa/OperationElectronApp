// electron/features/auth/oauth.ts

import { createHash, randomBytes } from "node:crypto";

import type { OAuthToken } from "@shared/types/auth";

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

  return {
    verifier,
    challenge,
  };
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
  if (typeof value !== "string") {
    return null;
  }

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
