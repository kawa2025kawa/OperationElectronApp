//electron\auth\token.ts

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { app } from "electron";

import type { OAuthToken, StoredToken } from "@shared/types/authTypes";

const STORE_FILE = "auth.json";

function getStorePath(): string {
  return path.join(app.getPath("userData"), STORE_FILE);
}

export async function saveToken(token: OAuthToken): Promise<void> {
  const stored: StoredToken = {
    accessToken: token.accessToken,

    refreshToken: token.refreshToken,

    expiresAt: token.expiresIn ? Date.now() + token.expiresIn * 1000 : null,
  };

  await fs.writeFile(getStorePath(), JSON.stringify(stored, null, 2), "utf-8");
}

export async function loadToken(): Promise<StoredToken | null> {
  try {
    const json = await fs.readFile(getStorePath(), "utf-8");

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await fs.unlink(getStorePath());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function restoreSession(): Promise<boolean> {
  const token = await loadToken();

  if (!token) {
    return false;
  }

  if (!isExpired(token) || token.refreshToken) {
    return true;
  }

  await clearToken();

  return false;
}

function isExpired(token: StoredToken): boolean {
  if (!token.expiresAt) {
    return false;
  }

  return Date.now() >= token.expiresAt;
}
