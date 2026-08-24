// electron/features/spreadsheet/googleOAuthService.ts

import { shell } from "electron";
import type { AuthSession } from "@shared/types/authTypes";
import { getGoogleCredentials } from "../auth/credentials";
import { startListener } from "../auth/listener";
import {
  createPkce,
  exchangeToken,
  generateAuthUrl,
  generateState,
  refreshToken,
} from "../auth/oauth";
import {
  clearToken,
  isTokenExpired,
  loadToken,
  saveToken,
} from "../auth/token";

const DEFAULT_PORT = 8888;
const REDIRECT_HOST = "127.0.0.1";

export class GoogleOAuthService {
  // ===================================================
  // Login
  // ===================================================

  async login(port = DEFAULT_PORT): Promise<AuthSession> {
    const { clientId, clientSecret } = getGoogleCredentials();
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

    return saveToken(token);
  }

  // ===================================================
  // Load Session
  // ===================================================

  async loadSession(): Promise<AuthSession | null> {
    const session = await loadToken();
    if (!session) return null;

    if (!isTokenExpired(session)) return session;

    if (!session.refreshToken) {
      await clearToken();
      return null;
    }

    return this.refreshSession(session.refreshToken);
  }

  // ===================================================
  // Logout
  // ===================================================

  async clearSession(): Promise<void> {
    await clearToken();
  }

  // ===================================================
  // Refresh
  // ===================================================

  private async refreshSession(
    refreshTokenValue: string,
  ): Promise<AuthSession | null> {
    try {
      const { clientId, clientSecret } = getGoogleCredentials();

      const token = await refreshToken(
        clientId,
        clientSecret,
        refreshTokenValue,
      );

      if (!token.refreshToken) {
        token.refreshToken = refreshTokenValue;
      }

      return saveToken(token);
    } catch (error) {
      console.error("[GoogleOAuth] Token refresh failed:", error);
      await clearToken();
      return null;
    }
  }
}
