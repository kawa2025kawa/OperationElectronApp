// electron/services/GoogleOAuthService.ts

import { shell } from "electron";

import type { AuthSession, OAuthToken } from "@shared/types/authTypes";

import { getGoogleClientId, getGoogleClientSecret } from "./auth/credentials";
import { startListener } from "./auth/listener";
import {
  createPkce,
  exchangeToken,
  generateAuthUrl,
  generateState,
  refreshToken,
} from "./auth/oauth";
import { clearToken, loadToken, saveToken } from "./auth/token";

const DEFAULT_PORT = 8888;
const REDIRECT_HOST = "127.0.0.1";

export class GoogleOAuthService {
  async login(port = DEFAULT_PORT): Promise<AuthSession> {
    const clientId = getGoogleClientId();
    const clientSecret = getGoogleClientSecret();

    const { verifier, challenge } = createPkce();
    const state = generateState();

    const redirectUri = `http://${REDIRECT_HOST}:${port}`;

    const authUrl = generateAuthUrl(clientId, redirectUri, challenge, state);

    await shell.openExternal(authUrl);

    const { code } = await startListener(port, state);

    const token = await exchangeToken(
      clientId,
      clientSecret,
      code,
      redirectUri,
      verifier,
    );

    await saveToken(token);

    return this.toAuthSession(token);
  }

  async loadSession(): Promise<AuthSession | null> {
    const session = await loadToken();

    if (!session) {
      return null;
    }

    if (session.expiresAt === null || Date.now() < session.expiresAt) {
      return session;
    }

    if (!session.refreshToken) {
      await clearToken();
      return null;
    }

    return this.refreshSession(session.refreshToken);
  }

  async clearSession(): Promise<void> {
    await clearToken();
  }

  private async refreshSession(
    refreshTokenValue: string,
  ): Promise<AuthSession | null> {
    try {
      const clientId = getGoogleClientId();
      const clientSecret = getGoogleClientSecret();

      const token = await refreshToken(
        clientId,
        clientSecret,
        refreshTokenValue,
      );

      if (!token.refreshToken) {
        token.refreshToken = refreshTokenValue;
      }

      await saveToken(token);

      return this.toAuthSession(token);
    } catch (error) {
      console.error("[GoogleOAuth] token refresh failed", error);

      await clearToken();

      return null;
    }
  }

  private toAuthSession(token: OAuthToken): AuthSession {
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt:
        token.expiresIn !== null ? Date.now() + token.expiresIn * 1000 : null,
    };
  }
}
