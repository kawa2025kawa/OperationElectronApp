// electron/features/system/systemService.ts

import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, shell } from "electron";
import fs from "fs-extra";
import type { UpdateInfo } from "@shared/types/electron/ipcTypes";
import { toErrorMessage } from "@shared/utils/sharedUtils";
import {
  ensureSpreadsheetCredentialsLoaded,
  getServiceCredential,
  type ServiceCredentialKey,
  type ServiceCredentialsConfig,
} from "./credentialStore";

const SYSTEM_CONFIG = {
  updateDirectory:
    "\\\\192.88.1.210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp",
  updateInfoFileName: "OperationElectronApp_update.json",
  manualBaseUrl: "https://sites.google.com/belc.co.jp",
} as const;

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["https:", "http:"]);

const ALLOWED_LOCAL_EXTENSIONS = new Set([
  ".pdf",
  ".xlsx",
  ".xls",
  ".xlsm",
  ".csv",
  ".txt",
  ".dat",
  ".zip",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
]);

const ALLOWED_LOCAL_BASE_DIRS: readonly string[] = [
  SYSTEM_CONFIG.updateDirectory,
  path.join(os.homedir(), "Desktop"),
  os.tmpdir(),
  "\\\\192.88.",
  "\\\\192.2.",
  "\\\\192.161.",
  "\\\\172.25.",
  "\\\\mdsyuhai01.belc01.belc.local\\",
  "\\\\c0088150\\",
  "\\\\s0088003\\",
];

export async function getServiceCredentialAsync<K extends ServiceCredentialKey>(
  key: K,
): Promise<ServiceCredentialsConfig[K]> {
  await ensureSpreadsheetCredentialsLoaded();
  return getServiceCredential(key);
}

function normalizeWinPath(targetPath: string): string {
  return path.win32.normalize(targetPath.replace(/\//g, "\\"));
}

function isSubPathOf(candidatePath: string, baseDir: string): boolean {
  const candidate = normalizeWinPath(candidatePath).toLowerCase();
  const base = normalizeWinPath(baseDir).replace(/\\+$/, "").toLowerCase();
  return candidate === base || candidate.startsWith(`${base}\\`);
}

function isAllowedBaseLocation(
  normalizedPath: string,
  lowerPath: string,
): boolean {
  return ALLOWED_LOCAL_BASE_DIRS.some((base) => {
    const isIpPrefix =
      base.startsWith("\\\\") && !base.replace(/^\\\\/, "").includes("\\");
    return isIpPrefix
      ? lowerPath.startsWith(base.toLowerCase())
      : isSubPathOf(normalizedPath, base);
  });
}

async function assertAllowedLocalPath(normalizedPath: string): Promise<void> {
  if (/(?:^|[\\/])\.\.(?:[\\/]|$)/.test(normalizedPath)) {
    throw new Error("不正な相対パス指定が含まれています");
  }

  const lower = normalizedPath.toLowerCase();
  if (
    isSubPathOf(normalizedPath, SYSTEM_CONFIG.updateDirectory) &&
    lower.endsWith(".exe")
  ) {
    return;
  }

  if (!isAllowedBaseLocation(normalizedPath, lower)) {
    throw new Error("許可されていないフォルダのパスは開けません");
  }

  try {
    const stats = await fs.stat(normalizedPath);
    if (stats.isDirectory()) return;
  } catch {
    // stat に失敗した場合は拡張子判定へフォールバック
  }

  const ext = path.win32.extname(lower);
  if (!ext || !ALLOWED_LOCAL_EXTENSIONS.has(ext)) {
    throw new Error(
      `許可されていないファイル形式です (${ext || "拡張子なし"})`,
    );
  }
}

function resolveLocalPathFromTarget(target: string): string {
  if (!/^file:/i.test(target)) {
    return normalizeWinPath(target);
  }

  try {
    return normalizeWinPath(fileURLToPath(target));
  } catch {
    return normalizeWinPath(
      decodeURIComponent(target.replace(/^file:[\\/]+/i, "\\\\")),
    );
  }
}

export function resolveResourcePath(fileName: string): string {
  return app?.isPackaged
    ? path.join(process.resourcesPath, fileName)
    : path.join(process.cwd(), "resources", fileName);
}

function getUpdateInfoPath(): string {
  const baseDirectory = app.isPackaged
    ? SYSTEM_CONFIG.updateDirectory
    : app.getAppPath();

  return path.join(baseDirectory, SYSTEM_CONFIG.updateInfoFileName);
}

export function getManualUrl(target: string, isAuto = false): string {
  const cleanTarget = target.trim();
  const basePrefix = isAuto ? "operation-auto-manual" : "operation-manual";

  return !cleanTarget || cleanTarget.toLowerCase() === "true"
    ? `${SYSTEM_CONFIG.manualBaseUrl}/${basePrefix}`
    : `${SYSTEM_CONFIG.manualBaseUrl}/${basePrefix}-${cleanTarget}`;
}

export function getMainWindow(): BrowserWindow | null {
  const win = BrowserWindow.getAllWindows()[0];
  return win && !win.isDestroyed() ? win : null;
}

export async function openExternalOrPath(
  target: string,
  options?: { skipLocalWhitelist?: boolean },
): Promise<void> {
  const cleanTarget = target.trim();
  if (!cleanTarget) return;

  const isNonFileUriScheme =
    /^[a-z][a-z0-9+.-]*:/i.test(cleanTarget) &&
    !/^[a-z]:\\/i.test(cleanTarget) &&
    !/^file:/i.test(cleanTarget);

  if (isNonFileUriScheme) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(cleanTarget);
    } catch {
      throw new Error("不正なURL形式です");
    }

    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsedUrl.protocol)) {
      throw new Error(
        `許可されていないURLスキームです (${parsedUrl.protocol})`,
      );
    }

    await shell.openExternal(parsedUrl.toString());
    return;
  }

  const normalized = resolveLocalPathFromTarget(cleanTarget);

  if (!options?.skipLocalWhitelist) {
    await assertAllowedLocalPath(normalized);
  }

  const error = await shell.openPath(normalized);
  if (error) {
    throw new Error(`パスの起動に失敗しました: ${error}`);
  }
}

export async function readUpdateInfo(): Promise<UpdateInfo | null> {
  try {
    const data: unknown = await fs.readJson(getUpdateInfoPath());
    if (
      typeof data === "object" &&
      data !== null &&
      typeof (data as Record<string, unknown>).version === "string"
    ) {
      return data as UpdateInfo;
    }
    return null;
  } catch (error) {
    console.warn(
      `[systemService] Failed to read update info: ${toErrorMessage(error)}`,
    );
    return null;
  }
}
