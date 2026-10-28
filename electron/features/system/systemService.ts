// electron/features/system/systemService.ts

import { BrowserWindow, shell } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { UpdateInfo } from "@shared/types/system";

const UPDATE_DIRECTORY =
  "\\\\192.88.1.210\\情報システム\\チェックリスト\\05_作業マニュアル\\オペレーション関連\\ソフトウェア\\OperationApp";

const UPDATE_INFO_PATH = path.join(
  UPDATE_DIRECTORY,
  "OperationElectronApp_update.json",
);

// 対象管理Noに対応するWebマニュアルのURLを生成して返す。
export function getManualUrl(target: string): string {
  return `https://sites.google.com/belc.co.jp/operation-manual-${target}`;
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

  const normalized = cleanTarget.replace(/\//g, "\\");
  const error = await shell.openPath(normalized);
  if (error) {
    throw new Error(`パスの起動に失敗しました: ${error}`);
  }
}

// 共有ディレクトリからアプリの最新アップデート情報を読み込んで返す。
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
