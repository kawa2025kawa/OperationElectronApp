// electron/features/operation/jobs/scripts/helpers/networkAuthHelper.ts

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs-extra";
import { getNetworkCredential } from "@electron/features/system/credentialStore";

const execFileAsync = promisify(execFile);

const NETWORK_AUTH_CONFIG = {
  commandTimeoutMs: 10_000,
} as const;

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

  const credential = getNetworkCredential(unc.host);
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
        timeout: NETWORK_AUTH_CONFIG.commandTimeoutMs,
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
          timeout: NETWORK_AUTH_CONFIG.commandTimeoutMs,
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
            timeout: NETWORK_AUTH_CONFIG.commandTimeoutMs,
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

/** ベースフォルダへのアクセス権限を確認しつつネットワーク認証リトライ付きで処理を実行する */
export async function withNetworkBaseDirAuthRetry<T>(
  baseDir: string,
  operation: () => Promise<T>,
): Promise<T> {
  return withNetworkAuthRetry(baseDir, async () => {
    try {
      await fs.stat(baseDir);
    } catch (error: unknown) {
      if (isAccessDeniedError(error)) {
        throw error;
      }
    }

    return operation();
  });
}
