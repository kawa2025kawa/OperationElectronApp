// electron/features/system/systemService.ts

import { BrowserWindow, shell } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UpdateInfo } from "@shared/types/system";

// ============================================================
// System Configuration & Types
// ============================================================

interface SystemServiceConfig {
  readonly updateDirectory: string;
  readonly updateInfoFileName: string;
  readonly manualBaseUrl: string;
}

const SYSTEM_CONFIG: SystemServiceConfig = {
  updateDirectory:
    "\\\\192.88.1.210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp",
  updateInfoFileName: "OperationElectronApp_update.json",
  manualBaseUrl: "https://sites.google.com/belc.co.jp",
} as const;

const UPDATE_INFO_PATH = path.join(
  SYSTEM_CONFIG.updateDirectory,
  SYSTEM_CONFIG.updateInfoFileName,
);

// 対象管理Noに対応するWebマニュアルのURLを生成して返す。
export function getManualUrl(target: string, isAuto = false): string {
  const cleanTarget = target.trim();
  const basePrefix = isAuto ? "operation-auto-manual" : "operation-manual";

  if (!cleanTarget || cleanTarget.toLowerCase() === "true") {
    return `${SYSTEM_CONFIG.manualBaseUrl}/${basePrefix}`;
  }

  return `${SYSTEM_CONFIG.manualBaseUrl}/${basePrefix}-${cleanTarget}`;
}

// 破棄されていないアクティブなメインウィンドウインスタンスを取得する。
export function getMainWindow(): BrowserWindow | null {
  const win = BrowserWindow.getAllWindows()[0];
  return win && !win.isDestroyed() ? win : null;
}

// URLまたはローカルパスを判定し適切な既定アプリまたはブラウザで開く。
export async function openExternalOrPath(target: string): Promise<void> {
  const cleanTarget = target.trim();
  if (!cleanTarget) return;

  if (/^(https?|mailto|tel):/i.test(cleanTarget)) {
    await shell.openExternal(cleanTarget);
    return;
  }

  let localPath = cleanTarget;
  if (/^file:/i.test(localPath)) {
    try {
      localPath = fileURLToPath(localPath);
    } catch {
      localPath = decodeURIComponent(
        localPath.replace(/^file:[\\/]+/i, "\\\\"),
      );
    }
  }

  const normalized = localPath.replace(/\//g, "\\");
  const error = await shell.openPath(normalized);
  if (error) {
    throw new Error(`パスの起動に失敗しました: ${error}`);
  }
}

// 共有フォルダからアプリの最新アップデート情報を読み込んで返す。
export async function readUpdateInfo(): Promise<UpdateInfo | null> {
  try {
    const content = await fs.readFile(UPDATE_INFO_PATH, "utf-8");
    const data: unknown = JSON.parse(content);
    if (
      typeof data === "object" &&
      data !== null &&
      typeof (data as Record<string, unknown>).version === "string"
    ) {
      return data as UpdateInfo;
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[systemService] Failed to read update info: ${message}`);
    return null;
  }
}
