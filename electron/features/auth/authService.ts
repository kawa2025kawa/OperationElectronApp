// electron/features/auth/authService.ts

import { randomBytes } from "node:crypto";
import path from "node:path";
import { app, safeStorage, shell } from "electron";
import fs from "fs-extra";
import { CodeChallengeMethod } from "google-auth-library";
import type {
  AuthProfile,
  AuthSession,
  OAuthToken,
} from "@shared/types/auth/authTypes";
import { fetchGoogleUserInfo } from "./googleApiClient";
import {
  createOAuthClient,
  exchangeAuthorizationCode,
  formatErrorMessage,
  isInvalidGrantError,
  OAUTH_CONFIG,
  refreshAccessToken,
  startOAuthListener,
} from "./oauthClient";

const AUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;

const SESSION_FILE_NAME = "google-oauth-session.dat";
const EXPIRY_BUFFER_MS = 60_000;

interface InFlightRequest {
  generation: number;
  accessToken: string;
  promise: Promise<AuthSession | null>;
}

type InFlightSlot = "refreshRequest" | "profileRequest";

class AuthService {
  private cachedSession: AuthSession | null = null;
  private isSessionLoaded = false;
  private generation = 0;
  private refreshRequest: InFlightRequest | null = null;
  private profileRequest: InFlightRequest | null = null;

  private getSessionFilePath(): string {
    return path.join(app.getPath("userData"), SESSION_FILE_NAME);
  }

  private isExpired(session: AuthSession): boolean {
    return (
      session.expiresAt !== null &&
      Date.now() + EXPIRY_BUFFER_MS >= session.expiresAt
    );
  }

  private writeSession(session: AuthSession): AuthSession {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Electron safeStorage encryption is not available");
    }

    fs.outputFileSync(
      this.getSessionFilePath(),
      safeStorage.encryptString(JSON.stringify(session)),
    );

    this.cachedSession = session;
    this.isSessionLoaded = true;
    return { ...session };
  }

  private saveToken(
    token: OAuthToken,
    profile: AuthProfile,
    expectedGeneration: number,
  ): AuthSession {
    if (expectedGeneration !== this.generation) {
      throw new Error("認証状態が変更されたため、セッションを保存できません");
    }

    const session = this.writeSession({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt:
        typeof token.expiresIn === "number" && Number.isFinite(token.expiresIn)
          ? Date.now() + token.expiresIn * 1000
          : null,
      email: profile.email ?? null,
      familyName: profile.familyName ?? null,
    });

    this.generation++;
    return session;
  }

  private readStoredSession(): AuthSession | null {
    if (this.isSessionLoaded) {
      return this.cachedSession ? { ...this.cachedSession } : null;
    }

    const filePath = this.getSessionFilePath();
    if (!fs.pathExistsSync(filePath)) {
      this.cachedSession = null;
      this.isSessionLoaded = true;
      return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      console.error(
        "[GoogleOAuth] Electron safeStorage encryption is not available",
      );
      return null;
    }

    try {
      const parsed = JSON.parse(
        safeStorage.decryptString(fs.readFileSync(filePath)),
      ) as Partial<AuthSession>;

      if (
        typeof parsed.accessToken !== "string" ||
        !parsed.accessToken.trim()
      ) {
        throw new Error("Stored session does not contain a valid accessToken");
      }

      const session: AuthSession = {
        accessToken: parsed.accessToken.trim(),
        refreshToken:
          typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
        expiresAt:
          typeof parsed.expiresAt === "number" &&
          Number.isFinite(parsed.expiresAt)
            ? parsed.expiresAt
            : null,
        email: typeof parsed.email === "string" ? parsed.email : null,
        familyName:
          typeof parsed.familyName === "string" ? parsed.familyName : null,
      };

      this.cachedSession = session;
      this.isSessionLoaded = true;
      return { ...session };
    } catch (error) {
      console.error("[GoogleOAuth] Failed to load stored session:", error);
      this.deleteSessionFile();
      return null;
    }
  }

  private deleteSessionFile(expectedGeneration?: number): void {
    if (
      expectedGeneration !== undefined &&
      expectedGeneration !== this.generation
    ) {
      throw new Error("認証状態が変更されたため、セッションを保存できません");
    }

    fs.removeSync(this.getSessionFilePath());

    this.generation++;
    this.cachedSession = null;
    this.isSessionLoaded = true;
  }

  async login(): Promise<AuthSession> {
    const generation = this.generation;
    const client = createOAuthClient(
      `http://${OAUTH_CONFIG.host}:${OAUTH_CONFIG.port}`,
    );

    const { codeVerifier, codeChallenge } =
      await client.generateCodeVerifierAsync();
    const state = randomBytes(32).toString("hex");

    const authUrl = client.generateAuthUrl({
      scope: [...AUTH_SCOPES],
      access_type: "offline",
      prompt: "consent",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    });

    const code = await startOAuthListener(state, async () => {
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
    return this.saveToken(token, profile, generation);
  }

  async loadSession(forceRefresh = false): Promise<AuthSession | null> {
    const stored = this.readStoredSession();
    if (!stored) {
      return null;
    }

    const session =
      forceRefresh || this.isExpired(stored)
        ? await this.refreshSessionFor(stored)
        : stored;

    if (!session || (session.email && session.familyName)) {
      return session;
    }

    return this.restoreProfile(session);
  }

  clearSession(): void {
    this.deleteSessionFile();
    this.refreshRequest = null;
    this.profileRequest = null;
  }

  async refreshSessionFor(session: AuthSession): Promise<AuthSession | null> {
    const generation = this.generation;
    const current = this.readStoredSession();

    if (!current) {
      return null;
    }
    if (current.accessToken !== session.accessToken) {
      return current;
    }

    const { refreshToken } = current;
    if (!refreshToken) {
      this.deleteSessionFile(generation);
      return null;
    }

    return this.runCoalesced("refreshRequest", current, generation, () =>
      this.executeRefresh(current, refreshToken, generation),
    );
  }

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

  private async executeRefresh(
    session: AuthSession,
    refreshToken: string,
    generation: number,
  ): Promise<AuthSession | null> {
    let token: OAuthToken;

    try {
      token = await refreshAccessToken(refreshToken);
    } catch (error) {
      if (generation !== this.generation) {
        return this.readStoredSession();
      }

      if (isInvalidGrantError(error)) {
        console.warn("[AuthService] Refresh token is no longer valid");
        this.deleteSessionFile(generation);
        return null;
      }

      throw new Error(
        `Google token refresh failed: ${formatErrorMessage(error)}`,
        { cause: error },
      );
    }

    if (generation !== this.generation) {
      return this.readStoredSession();
    }

    token.refreshToken ??= refreshToken;

    return this.saveToken(
      token,
      { email: session.email, familyName: session.familyName },
      generation,
    );
  }

  private async restoreProfile(
    session: AuthSession,
  ): Promise<AuthSession | null> {
    const generation = this.generation;

    return this.runCoalesced(
      "profileRequest",
      session,
      generation,
      async () => {
        const profile = await fetchGoogleUserInfo(session.accessToken);
        if (generation !== this.generation) {
          return this.readStoredSession();
        }

        if (!profile.email && !profile.familyName) {
          return session;
        }

        const current = this.readStoredSession();
        if (
          !current ||
          generation !== this.generation ||
          current.accessToken !== session.accessToken
        ) {
          return generation === this.generation ? session : current;
        }

        return this.writeSession({
          ...current,
          email: profile.email ?? current.email,
          familyName: profile.familyName ?? current.familyName,
        });
      },
    );
  }
}

export const authService = new AuthService();
