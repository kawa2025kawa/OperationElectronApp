// electron/features/operation/jobs/scripts/helpers/networkAuthHelper.ts

import { app } from "electron";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const NETWORK_CREDENTIALS_CONFIG = {
  fileName: "network-credentials.json",
  placeholderValue: "XXX",
  commandTimeoutMs: 10_000,
} as const;

export interface NetworkCredential {
  username: string;
  password: string;
}

type NetworkCredentialMap = Record<string, NetworkCredential>;

function getNetworkCredentialsFilePath(): string {
  const isPackaged = app?.isPackaged ?? false;
  return isPackaged
    ? path.join(process.resourcesPath, NETWORK_CREDENTIALS_CONFIG.fileName)
    : path.join(
        process.cwd(),
        "resources",
        NETWORK_CREDENTIALS_CONFIG.fileName,
      );
}

function loadNetworkCredentials(): NetworkCredentialMap {
  const filePath = getNetworkCredentialsFilePath();

  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);

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

/**
 * UNCパス（例: \\192.161.2.1\d$\BELC\ftp\ORDERBOOK.pdf）から
 * ホスト名（192.161.2.1）と共有ルート（\\192.161.2.1\d$）を抽出する。
 */
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

/**
 * 対象UNCパスに対応する認証情報が network-credentials.json に定義されている場合、
 * net use コマンドで共有ルートへ接続する。
 * @returns 認証接続を試行して成功した場合は true、定義なし・失敗時は false
 */
export async function ensureNetworkShareConnected(
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
    // すでに別セッション等で接続済みの場合（システムエラー 1219 等）は一度切断して再接続
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

/**
 * 共有フォルダ操作を実行し、EPERM / EACCES が発生した場合のみ
 * network-credentials.json の認証情報を使って接続後に1回リトライする。
 */
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
