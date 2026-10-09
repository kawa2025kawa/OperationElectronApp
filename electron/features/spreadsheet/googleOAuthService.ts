// electron/features/spreadsheet/googleOAuthService.ts

import { shell } from "electron";
import type { AuthSession, GoogleUserInfo } from "@shared/types/auth";
import {
  clearToken,
  createPkce,
  exchangeToken,
  generateAuthUrl,
  generateState,
  getGoogleCredentials,
  isTokenExpired,
  loadToken,
  refreshToken,
  saveToken,
  startListener,
  updateTokenProfile,
} from "@electron/features/auth/authHelpers";

const DEFAULT_PORT = 8888;
const REDIRECT_HOST = "127.0.0.1";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export interface GoogleApiRequestOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

export interface GoogleApiRequestOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

export class GoogleOAuthService {
  private refreshPromise: Promise<AuthSession | null> | null = null;

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

    const profile = await fetchUserInfo(token.accessToken);

    return saveToken(token, profile);
  }

  async loadSession(forceRefresh = false): Promise<AuthSession | null> {
    const session = await loadToken();

    if (!session) {
      return null;
    }

    if (!forceRefresh && !isTokenExpired(session)) {
      if (session.email && session.familyName) {
        return session;
      }

      return this.restoreProfile(session);
    }

    if (!session.refreshToken) {
      await clearToken();
      return null;
    }

    return this.refreshSession(
      session.refreshToken,
      session.email,
      session.familyName,
    );
  }

  async clearSession(): Promise<void> {
    await clearToken();
  }

  /**
   * Google APIへの認証済みリクエスト。
   *
   * - sessionがなければエラー
   * - token期限切れならrefresh
   * - APIが401を返した場合もrefreshして1回だけretry
   */
  async request(
    url: string,
    init: GoogleApiRequestOptions = {},
  ): Promise<Response> {
    const retryOnUnauthorized = init.retryOnUnauthorized ?? true;

    const { retryOnUnauthorized: _retry, ...requestInit } = init;

    let session = await this.getValidSession();

    if (!session) {
      throw new Error("Google認証セッションが存在しません");
    }

    let response = await this.fetchWithToken(url, requestInit, session);

    if (response.status !== 401 || !retryOnUnauthorized) {
      return response;
    }

    session = await this.refreshForRequest(session);

    if (!session) {
      throw new Error("Google認証セッションの更新に失敗しました");
    }

    response = await this.fetchWithToken(url, requestInit, session);

    return response;
  }

  async getJson<T>(
    url: string,
    init: GoogleApiRequestOptions = {},
  ): Promise<T> {
    const response = await this.request(url, init);
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Google API Error (${response.status}): ${responseText}`);
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (error) {
      throw new Error("Google API response is not valid JSON", {
        cause: error,
      });
    }
  }

  private async getValidSession(): Promise<AuthSession | null> {
    const session = await loadToken();

    if (!session) {
      return null;
    }

    if (!isTokenExpired(session)) {
      return session;
    }

    if (!session.refreshToken) {
      await clearToken();
      return null;
    }

    return this.refreshSession(
      session.refreshToken,
      session.email,
      session.familyName,
    );
  }

  private async refreshForRequest(
    session: AuthSession,
  ): Promise<AuthSession | null> {
    if (!session.refreshToken) {
      await clearToken();
      return null;
    }

    return this.refreshSession(
      session.refreshToken,
      session.email,
      session.familyName,
    );
  }

  private async fetchWithToken(
    url: string,
    init: RequestInit,
    session: AuthSession,
  ): Promise<Response> {
    const headers = new Headers(init.headers);

    headers.set("Authorization", `Bearer ${session.accessToken}`);
    headers.set("Accept", "application/json");

    return fetch(url, {
      ...init,
      headers,
    });
  }

  private async restoreProfile(session: AuthSession): Promise<AuthSession> {
    const profile = await fetchUserInfo(session.accessToken);

    if (!profile.email && !profile.familyName) {
      return session;
    }

    return (await updateTokenProfile(profile)) ?? session;
  }

  private async refreshSession(
    refreshTokenValue: string,
    email: string | null,
    familyName: string | null,
  ): Promise<AuthSession | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh(
      refreshTokenValue,
      email,
      familyName,
    );

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(
    refreshTokenValue: string,
    email: string | null,
    familyName: string | null,
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

      return saveToken(token, {
        email,
        familyName,
      });
    } catch (error) {
      console.error("[GoogleOAuth] Token refresh failed:", error);

      await clearToken();

      return null;
    }
  }
}

async function fetchUserInfo(accessToken: string): Promise<{
  email: string | null;
  familyName: string | null;
}> {
  try {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `[GoogleOAuth] UserInfo API failed with status: ${response.status}`,
      );

      return {
        email: null,
        familyName: null,
      };
    }

    const userInfo = (await response.json()) as GoogleUserInfo;

    return {
      email: normalize(userInfo.email),
      familyName: normalize(userInfo.family_name),
    };
  } catch (error) {
    console.error("[GoogleOAuth] Failed to fetch user info:", error);

    return {
      email: null,
      familyName: null,
    };
  }
}

function normalize(value?: string | null): string | null {
  const normalized = value?.trim();

  return normalized || null;
}
