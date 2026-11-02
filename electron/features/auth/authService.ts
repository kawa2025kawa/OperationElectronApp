// electron/features/auth/authService.ts

import { shell } from "electron";
import type { AuthSession, GoogleUserInfo } from "@shared/types/auth";
import {
  clearToken,
  createPkce,
  exchangeToken,
  generateAuthUrl,
  generateState,
  getGoogleCredentials,
  getTokenGeneration,
  isTokenExpired,
  loadToken,
  refreshToken,
  saveToken,
  startListener,
  updateTokenProfile,
} from "./authHelpers";

const DEFAULT_PORT = 8888;
const REDIRECT_HOST = "127.0.0.1";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export interface GoogleApiRequestOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

export interface AuthPublicSession {
  email: string | null;
  familyName: string | null;
}

interface RefreshRequest {
  generation: number;
  accessToken: string;
  promise: Promise<AuthSession | null>;
}

interface ProfileRequest {
  accessToken: string;
  promise: Promise<AuthSession | null>;
}

class AuthService {
  private refreshRequest: RefreshRequest | null = null;
  private profileRequest: ProfileRequest | null = null;

  async login(port = DEFAULT_PORT): Promise<AuthSession> {
    const generation = getTokenGeneration();
    const { clientId, clientSecret } = getGoogleCredentials();
    const { verifier, challenge } = createPkce();
    const state = generateState();
    const redirectUri = `http://${REDIRECT_HOST}:${port}`;
    const authUrl = generateAuthUrl(clientId, redirectUri, challenge, state);

    const { code } = await startListener(port, state, undefined, async () => {
      await shell.openExternal(authUrl);
    });

    const token = await exchangeToken(
      clientId,
      clientSecret,
      code,
      redirectUri,
      verifier,
    );

    return saveToken(
      token,
      await this.fetchUserInfo(token.accessToken),
      generation,
    );
  }

  async loadSession(forceRefresh = false): Promise<AuthSession | null> {
    const session = await this.getSession(forceRefresh);

    if (!session || (session.email && session.familyName)) {
      return session;
    }

    return this.restoreProfile(session);
  }

  async clearSession(): Promise<void> {
    this.refreshRequest = null;
    this.profileRequest = null;

    await clearToken();
  }

  async request(
    url: string,
    init: GoogleApiRequestOptions = {},
  ): Promise<Response> {
    const { retryOnUnauthorized = true, ...requestInit } = init;
    let session = await this.getSession();

    if (!session) {
      throw new Error("Google認証セッションが存在しません");
    }

    const response = await this.fetchWithToken(url, requestInit, session);

    if (response.status !== 401 || !retryOnUnauthorized) {
      return response;
    }

    session = await this.refreshSessionFor(session);

    if (!session) {
      throw new Error("Google認証セッションの更新に失敗しました");
    }

    return this.fetchWithToken(url, requestInit, session);
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

  private async getSession(forceRefresh = false): Promise<AuthSession | null> {
    const session = await loadToken();

    if (!session || (!forceRefresh && !isTokenExpired(session))) {
      return session;
    }

    return this.refreshSessionFor(session);
  }

  private async refreshSessionFor(
    session: AuthSession,
  ): Promise<AuthSession | null> {
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

    return this.refreshSession(currentSession, generation);
  }

  private async fetchWithToken(
    url: string,
    init: RequestInit,
    session: AuthSession,
  ): Promise<Response> {
    const headers = new Headers(init.headers);

    headers.set("Authorization", `Bearer ${session.accessToken}`);
    headers.set("Accept", "application/json");

    return fetch(url, { ...init, headers });
  }

  private async restoreProfile(
    session: AuthSession,
  ): Promise<AuthSession | null> {
    const existingRequest = this.profileRequest;

    if (existingRequest?.accessToken === session.accessToken) {
      return existingRequest.promise;
    }

    const generation = getTokenGeneration();

    const request: ProfileRequest = {
      accessToken: session.accessToken,
      promise: (async () => {
        const profile = await this.fetchUserInfo(session.accessToken);

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
          (await updateTokenProfile(
            profile,
            session.accessToken,
            generation,
          )) ?? loadToken()
        );
      })(),
    };

    this.profileRequest = request;

    try {
      return await request.promise;
    } finally {
      if (this.profileRequest === request) {
        this.profileRequest = null;
      }
    }
  }

  private async refreshSession(
    session: AuthSession,
    generation: number,
  ): Promise<AuthSession | null> {
    const existingRequest = this.refreshRequest;

    if (
      existingRequest?.generation === generation &&
      existingRequest.accessToken === session.accessToken
    ) {
      return existingRequest.promise;
    }

    const request: RefreshRequest = {
      generation,
      accessToken: session.accessToken,
      promise: (async () => {
        try {
          const { clientId, clientSecret } = getGoogleCredentials();
          const token = await refreshToken(
            clientId,
            clientSecret,
            session.refreshToken!,
          );

          if (generation !== getTokenGeneration()) {
            return loadToken();
          }

          if (!token.refreshToken) {
            token.refreshToken = session.refreshToken;
          }

          return await saveToken(
            token,
            {
              email: session.email,
              familyName: session.familyName,
            },
            generation,
          );
        } catch (error) {
          if (generation === getTokenGeneration()) {
            console.error("[AuthService] Token refresh failed:", error);
            await clearToken(generation);
          }

          return null;
        }
      })(),
    };

    this.refreshRequest = request;

    try {
      return await request.promise;
    } finally {
      if (this.refreshRequest === request) {
        this.refreshRequest = null;
      }
    }
  }

  private async fetchUserInfo(accessToken: string): Promise<{
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
}

export const authService = new AuthService();
