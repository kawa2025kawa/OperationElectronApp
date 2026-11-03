// electron/features/auth/authService.ts

import { shell } from "electron";
import { randomBytes } from "node:crypto";
import { CodeChallengeMethod } from "google-auth-library";
import type { AuthSession, OAuthToken } from "@shared/types/auth";
import { OAUTH_LISTENER_CONFIG, startListener } from "./listener";
import {
  createOAuthClient,
  exchangeAuthorizationCode,
  fetchGoogleUserInfo,
  isInvalidGrantError,
  refreshAccessToken,
} from "./oauthClient";
import {
  clearToken,
  getTokenGeneration,
  isTokenExpired,
  loadToken,
  saveToken,
  updateTokenProfile,
} from "./token";

// Google認証に関するエラーを表す。
export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export interface GoogleApiRequestOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

export const AUTH_SERVICE_CONFIG = {
  defaultPort: 8888,
  redirectHost: OAUTH_LISTENER_CONFIG.host,
  scopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.settings.basic",
    "https://www.googleapis.com/auth/gmail.compose",
  ] as const,
} as const;

export type GoogleScope = (typeof AUTH_SERVICE_CONFIG.scopes)[number];

interface InFlightRequest {
  generation: number;
  accessToken: string;
  promise: Promise<AuthSession | null>;
}

class AuthService {
  private refreshRequest: InFlightRequest | null = null;
  private profileRequest: InFlightRequest | null = null;

  // ブラウザー認証を開始し、セッションを作成する。
  async login(port = AUTH_SERVICE_CONFIG.defaultPort): Promise<AuthSession> {
    const generation = getTokenGeneration();
    const client = createOAuthClient(
      `http://${AUTH_SERVICE_CONFIG.redirectHost}:${port}`,
    );

    const { codeVerifier, codeChallenge } =
      await client.generateCodeVerifierAsync();

    const state = randomBytes(32).toString("hex");

    const authUrl = client.generateAuthUrl({
      scope: [...AUTH_SERVICE_CONFIG.scopes],
      access_type: "offline",
      prompt: "consent",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    });

    const { code } = await startListener(port, state, undefined, async () => {
      await shell.openExternal(authUrl);
    });

    let token: OAuthToken;
    try {
      token = await exchangeAuthorizationCode(client, code, codeVerifier);
    } catch (error) {
      throw new Error(
        `Google token exchange failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }

    const profile = await fetchGoogleUserInfo(token.accessToken);
    return saveToken(token, profile, generation);
  }

  // 保存済みセッションを取得し、必要に応じてリフレッシュやプロフィール補完を行う。
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

    const refreshed = await this.refreshSessionFor(session);
    if (!refreshed || (refreshed.email && refreshed.familyName)) {
      return refreshed;
    }

    return this.restoreProfile(refreshed);
  }

  // セッションを破棄する。
  async clearSession(): Promise<void> {
    this.refreshRequest = null;
    this.profileRequest = null;
    await clearToken();
  }

  // 401応答時や期限切れ時にトークンを更新する。
  async refreshSessionFor(session: AuthSession): Promise<AuthSession | null> {
    const generation = getTokenGeneration();
    const currentSession = await loadToken();

    if (generation !== getTokenGeneration()) {
      return loadToken();
    }

    if (!currentSession) {
      return null;
    }

    if (currentSession.accessToken !== session.accessToken) {
      return currentSession;
    }

    if (!currentSession.refreshToken) {
      await clearToken(generation);
      return null;
    }

    return this.performCoalescedRefresh(currentSession, generation);
  }

  // 同一セッションに対するトークン更新要求を集約する。
  private async performCoalescedRefresh(
    session: AuthSession,
    generation: number,
  ): Promise<AuthSession | null> {
    const existing = this.refreshRequest;
    if (
      existing?.generation === generation &&
      existing.accessToken === session.accessToken
    ) {
      return existing.promise;
    }

    const request: InFlightRequest = {
      generation,
      accessToken: session.accessToken,
      promise: Promise.resolve(null),
    };

    request.promise = this.executeRefresh(session, generation);
    this.refreshRequest = request;

    try {
      return await request.promise;
    } finally {
      if (this.refreshRequest === request) {
        this.refreshRequest = null;
      }
    }
  }

  // トークンの再取得と保存を実行する。
  private async executeRefresh(
    session: AuthSession,
    generation: number,
  ): Promise<AuthSession | null> {
    let token: OAuthToken;

    try {
      token = await refreshAccessToken(session.refreshToken!);
    } catch (error) {
      if (generation !== getTokenGeneration()) {
        return loadToken();
      }

      if (isInvalidGrantError(error)) {
        console.warn("[AuthService] Refresh token is no longer valid");
        await clearToken(generation);
        return null;
      }

      throw new Error(
        `Google token refresh failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }

    if (generation !== getTokenGeneration()) {
      return loadToken();
    }

    token.refreshToken ??= session.refreshToken;

    return saveToken(
      token,
      {
        email: session.email,
        familyName: session.familyName,
      },
      generation,
    );
  }

  // 不足しているプロフィール情報を取得して反映する。
  private async restoreProfile(
    session: AuthSession,
  ): Promise<AuthSession | null> {
    const generation = getTokenGeneration();
    const existing = this.profileRequest;

    if (
      existing?.generation === generation &&
      existing.accessToken === session.accessToken
    ) {
      return existing.promise;
    }

    const request: InFlightRequest = {
      generation,
      accessToken: session.accessToken,
      promise: Promise.resolve(null),
    };

    request.promise = (async () => {
      const profile = await fetchGoogleUserInfo(session.accessToken);
      if (generation !== getTokenGeneration()) {
        return loadToken();
      }

      if (!profile.email && !profile.familyName) {
        const currentSession = await loadToken();
        if (
          generation !== getTokenGeneration() ||
          !currentSession ||
          currentSession.accessToken !== session.accessToken
        ) {
          return loadToken();
        }
        return currentSession;
      }

      return (
        (await updateTokenProfile(profile, session.accessToken, generation)) ??
        loadToken()
      );
    })();

    this.profileRequest = request;

    try {
      return await request.promise;
    } finally {
      if (this.profileRequest === request) {
        this.profileRequest = null;
      }
    }
  }

  // 認証トークンを付与してGoogle APIへ送信する。
  private async fetchWithToken(
    url: string,
    init: RequestInit,
    accessToken: string,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set("Accept", "application/json");

    return fetch(url, { ...init, headers });
  }

  // Google APIへ認証済みリクエストを送信する。
  async request(
    url: string,
    init: GoogleApiRequestOptions = {},
  ): Promise<Response> {
    const { retryOnUnauthorized = true, ...requestInit } = init;
    let session = await this.loadSession();

    if (!session) {
      throw new GoogleAuthError("Google認証セッションが存在しません");
    }

    const response = await this.fetchWithToken(
      url,
      requestInit,
      session.accessToken,
    );

    if (response.status !== 401 || !retryOnUnauthorized) {
      return response;
    }

    session = await this.refreshSessionFor(session);
    if (!session) {
      throw new GoogleAuthError("Google認証セッションの更新に失敗しました");
    }

    return this.fetchWithToken(url, requestInit, session.accessToken);
  }

  // Google APIのレスポンスをJSONとして取得する。
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
}

export const authService = new AuthService();
