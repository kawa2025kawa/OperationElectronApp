// electron/auth/oauth.ts

import { createHash, randomBytes } from "node:crypto";

import type { OAuthToken } from "@shared/types/authTypes";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

interface GoogleTokenResponse {
  access_token: string;

  refresh_token?: string | null;

  expires_in?: number;

  id_token?: string | null;
}

// ==================================================
// PKCE
// ==================================================

export function createPkce(): {
  verifier: string;
  challenge: string;
} {
  const verifier = randomBytes(32).toString("hex");

  const challenge = createHash("sha256").update(verifier).digest("base64url");

  return {
    verifier,
    challenge,
  };
}

// ==================================================
// Authorization URL
// ==================================================

export function generateAuthUrl(
  clientId: string,
  redirectUri: string,
  challenge: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,

    redirect_uri: redirectUri,

    response_type: "code",

    scope: ["openid", "email", "profile"].join(" "),

    access_type: "offline",

    prompt: "consent",

    code_challenge: challenge,

    code_challenge_method: "S256",
  });

  return `${AUTH_URL}?${params.toString()}`;
}

// ==================================================
// Exchange Authorization Code
// ==================================================

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

  const response = await fetch(TOKEN_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },

    body,
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status}`);
  }

  const token = (await response.json()) as GoogleTokenResponse;

  return {
    accessToken: token.access_token,

    refreshToken: token.refresh_token ?? null,

    expiresIn: token.expires_in ?? null,

    idToken: token.id_token ?? null,
  };
}

// ==================================================
// Refresh Token
// ==================================================

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

  const response = await fetch(TOKEN_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },

    body,
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.status}`);
  }

  const token = (await response.json()) as GoogleTokenResponse;

  return {
    accessToken: token.access_token,

    // refresh_token は refresh 時に返らない場合がある
    refreshToken: token.refresh_token ?? null,

    expiresIn: token.expires_in ?? null,

    idToken: token.id_token ?? null,
  };
}
