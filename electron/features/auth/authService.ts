// electron/features/auth/authService.ts

import { shell } from "electron";
import { randomBytes } from "node:crypto";
import { CodeChallengeMethod } from "google-auth-library";
import type { AuthSession, OAuthToken } from "@shared/types/auth/authTypes";
import { OAUTH_LISTENER_CONFIG, startListener } from "./listener";
import {
  createOAuthClient,
  exchangeAuthorizationCode,
  fetchGoogleUserInfo,
  formatErrorMessage,
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

const AUTH_SERVICE_CONFIG = {
  defaultPort: 8888,
  redirectHost: OAUTH_LISTENER_CONFIG.host,
  scopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.settings.basic",
    "https://www.googleapis.com/auth/gmail.compose",
  ] as const,
} as const;

interface InFlightRequest {
  generation: number;
  accessToken: string;
  promise: Promise<AuthSession | null>;
}

type InFlightSlot = "refreshRequest" | "profileRequest";

class AuthService {
  private refreshRequest: InFlightRequest | null = null;
  private profileRequest: InFlightRequest | null = null;

  // ブラウザー認証を開始し、セッションを作成する
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
        `Google token exchange failed: ${formatErrorMessage(error)}`,
        { cause: error },
      );
    }

    const profile = await fetchGoogleUserInfo(token.accessToken);
    return saveToken(token, profile, generation);
  }

  // 保存済みセッションを取得し、必要に応じてリフレッシュやプロフィール補完を行う
  async loadSession(forceRefresh = false): Promise<AuthSession | null> {
    const stored = await loadToken();
    if (!stored) {
      return null;
    }

    const session =
      forceRefresh || isTokenExpired(stored)
        ? await this.refreshSessionFor(stored)
        : stored;

    if (!session || (session.email && session.familyName)) {
      return session;
    }

    return this.restoreProfile(session);
  }

  // セッションを破棄する
  async clearSession(): Promise<void> {
    this.refreshRequest = null;
    this.profileRequest = null;
    await clearToken();
  }

  // 401応答時や期限切れ時にトークンを更新する
  async refreshSessionFor(session: AuthSession): Promise<AuthSession | null> {
    const generation = getTokenGeneration();
    const current = await loadToken();

    if (!current || generation !== getTokenGeneration()) {
      return loadToken();
    }

    if (current.accessToken !== session.accessToken) {
      return current;
    }

    if (!current.refreshToken) {
      await clearToken(generation);
      return null;
    }

    return this.runCoalesced("refreshRequest", current, generation, () =>
      this.executeRefresh(current, generation),
    );
  }

  // 同一セッション・世代に対する並行リクエストを1つに集約する
  private async runCoalesced(
    slot: InFlightSlot,
    session: AuthSession,
    generation: number,
    runner: () => Promise<AuthSession | null>,
  ): Promise<AuthSession | null> {
    const current = this[slot];
    if (
      current?.generation === generation &&
      current.accessToken === session.accessToken
    ) {
      return current.promise;
    }

    const request: InFlightRequest = {
      generation,
      accessToken: session.accessToken,
      promise: runner(),
    };
    this[slot] = request;

    try {
      return await request.promise;
    } finally {
      if (this[slot] === request) {
        this[slot] = null;
      }
    }
  }

  // トークンの再取得と保存を実行する
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
        `Google token refresh failed: ${formatErrorMessage(error)}`,
        { cause: error },
      );
    }

    if (generation !== getTokenGeneration()) {
      return loadToken();
    }

    token.refreshToken ??= session.refreshToken;

    return saveToken(
      token,
      { email: session.email, familyName: session.familyName },
      generation,
    );
  }

  // 不足しているプロフィール情報を取得して反映する
  private async restoreProfile(
    session: AuthSession,
  ): Promise<AuthSession | null> {
    const generation = getTokenGeneration();

    return this.runCoalesced("profileRequest", session, generation, async () => {
      const profile = await fetchGoogleUserInfo(session.accessToken);
      if (generation !== getTokenGeneration()) {
        return loadToken();
      }

      if (!profile.email && !profile.familyName) {
        return loadToken();
      }

      return (
        (await updateTokenProfile(
          profile,
          session.accessToken,
          generation,
        )) ?? loadToken()
      );
    });
  }
}

export const authService = new AuthService();
