// electron/features/auth/credentials.ts

import { app } from "electron";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const CREDENTIAL_FILE = "google-oauth-credentials.json";

export interface GoogleCredentials {
  clientId: string;
  clientSecret?: string;
}

interface GoogleCredentialConfig {
  client_id?: unknown;
  client_secret?: unknown;
}

interface GoogleCredentialsJson {
  installed?: GoogleCredentialConfig;
  web?: GoogleCredentialConfig;
}

function getCredentialPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, CREDENTIAL_FILE)
    : path.join(process.cwd(), "resources", CREDENTIAL_FILE);
}

function readCredentialFile(filePath: string): string {
  if (!existsSync(filePath)) {
    throw new Error(`Google OAuth credentials not found: ${filePath}`);
  }

  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read Google OAuth credentials: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

function parseCredentialsJson(
  filePath: string,
  raw: string,
): GoogleCredentialsJson {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Credential JSON root must be an object");
    }

    return parsed as GoogleCredentialsJson;
  } catch (error) {
    throw new Error(
      `Failed to parse Google OAuth credentials: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

function getCredentialConfig(
  json: GoogleCredentialsJson,
): GoogleCredentialConfig {
  const config = json.installed ?? json.web;

  if (!config || typeof config !== "object") {
    throw new Error(
      'Google OAuth credentials must contain either "installed" or "web" configuration',
    );
  }

  return config;
}

function getRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Google OAuth ${fieldName} not found`);
  }

  return value.trim();
}

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function getGoogleCredentials(): GoogleCredentials {
  const filePath = getCredentialPath();
  const raw = readCredentialFile(filePath);
  const json = parseCredentialsJson(filePath, raw);
  const config = getCredentialConfig(json);

  return {
    clientId: getRequiredString(config.client_id, "client_id"),
    clientSecret: getOptionalString(config.client_secret),
  };
}

export function getGoogleClientId(): string {
  return getGoogleCredentials().clientId;
}

export function getGoogleClientSecret(): string | undefined {
  return getGoogleCredentials().clientSecret;
}
