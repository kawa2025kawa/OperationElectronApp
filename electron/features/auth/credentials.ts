//electron\features\auth\credentials.ts

import { app } from "electron";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const CREDENTIAL_FILE = "google-oauth-credentials.json";

export interface GoogleCredentials {
  clientId: string;
  clientSecret?: string;
}

export function getGoogleCredentials(): GoogleCredentials {
  const filePath = app.isPackaged
    ? path.join(process.resourcesPath, CREDENTIAL_FILE)
    : path.join(process.cwd(), "resources", CREDENTIAL_FILE);

  if (!existsSync(filePath)) {
    throw new Error(`Google OAuth credentials not found: ${filePath}`);
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const config = json.installed ?? json.web;

    if (!config || typeof config !== "object") {
      throw new Error('Credentials must contain "installed" or "web" config');
    }

    const clientId =
      typeof config.client_id === "string" ? config.client_id.trim() : "";
    if (!clientId) {
      throw new Error("Google OAuth client_id not found");
    }

    const clientSecret =
      typeof config.client_secret === "string" && config.client_secret.trim()
        ? config.client_secret.trim()
        : undefined;

    return { clientId, clientSecret };
  } catch (error) {
    throw new Error(
      `Failed to load Google OAuth credentials: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}
