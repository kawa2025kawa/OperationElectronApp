// electron/auth/credentials.ts

import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

const CREDENTIAL_FILE = "google-oauth-credentials.json";

function getCredentialPath(): string {
  return path.join(process.resourcesPath, CREDENTIAL_FILE);
}

export function hasGoogleCredentials(): boolean {
  return existsSync(getCredentialPath());
}

export function getGoogleCredentialsJson(): string {
  const file = getCredentialPath();

  if (!existsSync(file)) {
    throw new Error("Google OAuth credentials not found");
  }

  return readFileSync(file, "utf-8");
}

export function getGoogleClientId(): string {
  const json = JSON.parse(getGoogleCredentialsJson());

  const clientId = json.installed?.client_id ?? json.web?.client_id;

  if (!clientId) {
    throw new Error("Google client id not found");
  }

  return clientId;
}

export function getGoogleClientSecret(): string | undefined {
  const json = JSON.parse(getGoogleCredentialsJson());

  return json.installed?.client_secret ?? json.web?.client_secret;
}
