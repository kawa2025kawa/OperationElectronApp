// electron/features/operation/jobs/scripts/helpers/networkAuthHelper.ts

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs-extra";
import iconv from "iconv-lite";
import {
  ensureSpreadsheetCredentialsLoaded,
  getNetworkCredential,
} from "@electron/features/system/credentialStore";

const execFileAsync = promisify(execFile);

const NETWORK_AUTH_CONFIG = {
  commandTimeoutMs: 10_000,
  windowsCliEncoding: "cp932",
} as const;

export interface NetworkAuthError extends Error {
  code?: string;
  authDetail?: string;
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

function decodeCliOutput(value: unknown): string {
  if (Buffer.isBuffer(value)) {
    return iconv.decode(value, NETWORK_AUTH_CONFIG.windowsCliEncoding).trim();
  }
  return typeof value === "string" ? value.trim() : "";
}

function formatExecError(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return String(error);
  }
  const errObj = error as { stderr?: unknown; stdout?: unknown; message?: unknown };
  const stderr = decodeCliOutput(errObj.stderr);
  const stdout = decodeCliOutput(errObj.stdout);
  const message = typeof errObj.message === "string" ? errObj.message.trim() : "";
  return [stderr, stdout, message].filter(Boolean).join(" / ");
}

function attachAuthDetail(error: unknown, authDetail: string): NetworkAuthError {
  if (error instanceof Error) {
    const netErr = error as NetworkAuthError;
    netErr.authDetail = authDetail;
    return netErr;
  }
  const wrapped = new Error(String(error)) as NetworkAuthError;
  wrapped.authDetail = authDetail;
  return wrapped;
}

async function runNetCommand(args: string[]): Promise<void> {
  await execFileAsync("net", args, {
    windowsHide: true,
    timeout: NETWORK_AUTH_CONFIG.commandTimeoutMs,
    encoding: "buffer",
  });
}

async function ensureNetworkShareConnected(
  targetPath: string,
): Promise<{ connected: boolean; detail?: string }> {
  if (process.platform !== "win32") {
    return { connected: false, detail: "Windows環境以外のため自動認証対象外" };
  }

  const unc = parseUncTarget(targetPath);
  if (!unc) {
    return { connected: false, detail: `UNCパス形式不正: ${targetPath}` };
  }

  await ensureSpreadsheetCredentialsLoaded();

  const credential = getNetworkCredential(unc.host);
  if (!credential) {
    const detail = `Credentialsシートにホスト [${unc.host}] の資格情報が未登録`;
    console.warn(`[networkAuthHelper] ${detail}`);
    return { connected: false, detail };
  }

  const connectArgs = [
    "use",
    unc.shareRoot,
    `/user:${credential.username}`,
    credential.password,
    "/persistent:no",
  ];

  try {
    await runNetCommand(connectArgs);
    return { connected: true };
  } catch (error: unknown) {
    const execDetail = formatExecError(error);

    if (execDetail.includes("1219")) {
      try {
        await runNetCommand(["use", unc.shareRoot, "/delete", "/y"]);
        await runNetCommand(connectArgs);
        return { connected: true };
      } catch (retryError: unknown) {
        const detail = `net use 再接続失敗(1219後) [user=${credential.username}]: ${formatExecError(retryError)}`;
        console.warn(`[networkAuthHelper] ${detail}`);
        return { connected: false, detail };
      }
    }

    const detail = `net use 失敗 [user=${credential.username}]: ${execDetail}`;
    console.warn(`[networkAuthHelper] ${detail}`);
    return { connected: false, detail };
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

    const authResult = await ensureNetworkShareConnected(targetPath);
    if (!authResult.connected) {
      throw authResult.detail ? attachAuthDetail(error, authResult.detail) : error;
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
