// electron/features/operation/jobs/scripts/helpers/networkAuthHelper.ts

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs-extra";
import { resolveResourcePath } from "@electron/features/system/systemService";

const execFileAsync = promisify(execFile);

const NETWORK_CREDENTIALS_CONFIG = {
  fileName: "network-credentials.json",
  placeholderValue: "XXX",
  commandTimeoutMs: 10_000,
} as const;

interface NetworkCredential {
  username: string;
  password: string;
}

type NetworkCredentialMap = Record<string, NetworkCredential>;

function loadNetworkCredentials(): NetworkCredentialMap {
  const filePath = resolveResourcePath(NETWORK_CREDENTIALS_CONFIG.fileName);

  if (!fs.pathExistsSync(filePath)) {
    return {};
  }

  try {
    const parsed: unknown = fs.readJsonSync(filePath);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    const result: NetworkCredentialMap = {};

    for (const [host, entry] of Object.entries(parsed)) {
      if (typeof entry !== "object" || entry === null) continue;

      const record = entry as Record<string, unknown>;
      const username =
        typeof record.username === "string" ? record.username.trim() : "";
      const password =
        typeof record.password === "string" ? record.password.trim() : "";

      if (
        !username ||
        !password ||
        username === NETWORK_CREDENTIALS_CONFIG.placeholderValue ||
        password === NETWORK_CREDENTIALS_CONFIG.placeholderValue
      ) {
        continue;
      }

      result[host.trim().toLowerCase()] = { username, password };
    }

    return result;
  } catch (error) {
    console.warn(
      "[networkAuthHelper] Failed to load network-credentials.json:",
      error,
    );
    return {};
  }
}

function parseUncTarget(
  targetPath: string,
): { host: string; shareRoot: string } | null {
  const normalized = targetPath.replace(/\//g, "\\");
  const match = normalized.match(/^\\\\([^\\]+)\\([^\\]+)/);

  if (!match) {
    return null;
  }

  const host = match[1];
  const shareName = match[2];

  return {
    host,
    shareRoot: `\\\\${host}\\${shareName}`,
  };
}

function isAccessDeniedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: string }).code;
  return code === "EPERM" || code === "EACCES";
}

async function ensureNetworkShareConnected(
  targetPath: string,
): Promise<boolean> {
  if (process.platform !== "win32") {
    return false;
  }

  const unc = parseUncTarget(targetPath);
  if (!unc) {
    return false;
  }

  const credentialsMap = loadNetworkCredentials();
  const credential = credentialsMap[unc.host.toLowerCase()];

  if (!credential) {
    return false;
  }

  try {
    await execFileAsync(
      "net",
      [
        "use",
        unc.shareRoot,
        `/user:${credential.username}`,
        credential.password,
        "/persistent:no",
      ],
      {
        windowsHide: true,
        timeout: NETWORK_CREDENTIALS_CONFIG.commandTimeoutMs,
      },
    );
    return true;
  } catch (error: unknown) {
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error
        ? String((error as { stderr?: unknown }).stderr ?? "")
        : "";

    if (stderr.includes("1219")) {
      try {
        await execFileAsync("net", ["use", unc.shareRoot, "/delete", "/y"], {
          windowsHide: true,
          timeout: NETWORK_CREDENTIALS_CONFIG.commandTimeoutMs,
        });
        await execFileAsync(
          "net",
          [
            "use",
            unc.shareRoot,
            `/user:${credential.username}`,
            credential.password,
            "/persistent:no",
          ],
          {
            windowsHide: true,
            timeout: NETWORK_CREDENTIALS_CONFIG.commandTimeoutMs,
          },
        );
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}

export async function withNetworkAuthRetry<T>(
  targetPath: string,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (!isAccessDeniedError(error)) {
      throw error;
    }

    const connected = await ensureNetworkShareConnected(targetPath);
    if (!connected) {
      throw error;
    }

    return await operation();
  }
}
