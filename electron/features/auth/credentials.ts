// electron/services/auth/credentials.ts

import { app } from "electron";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// =====================================================
// Constants
// =====================================================

const CREDENTIAL_FILE = "google-oauth-credentials.json";

// =====================================================
// Types
// =====================================================

export interface GoogleCredentials {
  clientId: string;
  clientSecret?: string;
}

interface GoogleCredentialsJson {
  installed?: {
    client_id?: string;
    client_secret?: string;
  };

  web?: {
    client_id?: string;
    client_secret?: string;
  };
}

// =====================================================
// Path
// =====================================================

function getCredentialPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, CREDENTIAL_FILE);
  }

  return path.join(process.cwd(), "resources", CREDENTIAL_FILE);
}

// =====================================================
// Load JSON
// =====================================================

function loadCredentialsJson(): GoogleCredentialsJson {
  const filePath = getCredentialPath();

  if (!existsSync(filePath)) {
    throw new Error(`Google OAuth credentials not found: ${filePath}`);
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as GoogleCredentialsJson;
  } catch (error) {
    throw new Error(
      `Failed to parse Google OAuth credentials: ${
        error instanceof Error ? error.message : String(error)
      }`,
      {
        cause: error,
      },
    );
  }
}

// =====================================================
// Credentials
// =====================================================

export function getGoogleCredentials(): GoogleCredentials {
  const json = loadCredentialsJson();

  const config = json.installed ?? json.web;

  if (!config?.client_id) {
    throw new Error("Google OAuth client_id not found");
  }

  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
  };
}

// =====================================================
// Client ID
// =====================================================

export function getGoogleClientId(): string {
  return getGoogleCredentials().clientId;
}

// =====================================================
// Client Secret
// =====================================================

export function getGoogleClientSecret(): string | undefined {
  return getGoogleCredentials().clientSecret;
}
