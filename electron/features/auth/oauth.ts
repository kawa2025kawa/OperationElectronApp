// electron/services/auth/oauth.ts

import { createHash, randomBytes } from "node:crypto";
import type { OAuthToken } from "@shared/types/authTypes";

// =====================================================
// Constants
// =====================================================

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

// =====================================================
// Types
// =====================================================

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
}

export interface PkceChallenge {
  verifier: string;
  challenge: string;
}

// =====================================================
// PKCE & State
// =====================================================

export function createPkce(): PkceChallenge {
  const verifier = randomBytes(32).toString("hex");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

// =====================================================
// Authorization URL
// =====================================================

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

// =====================================================
// Token Requests
// =====================================================

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

// =====================================================
// Helper
// =====================================================

async function sendTokenRequest(
  body: URLSearchParams,
  errorMessagePrefix: string,
): Promise<OAuthToken> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `${errorMessagePrefix}: ${response.status} ${await response.text()}`,
    );
  }

  const token = (await response.json()) as GoogleTokenResponse;
  if (!token.access_token) {
    throw new Error(
      `${errorMessagePrefix}: response does not contain access_token`,
    );
  }

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    expiresIn: token.expires_in ?? null,
    idToken: token.id_token ?? null,
  };
}
