// electron/features/system/systemService.ts

import {
  app,
  BrowserWindow,
  dialog,
  shell,
  type OpenDialogOptions,
} from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { UpdateInfo } from "@shared/types/system";

const UPDATE_DIRECTORY = "\\\\S0088210\\共有\\OperationApp";
const UPDATE_INFO_PATH = path.join(
  UPDATE_DIRECTORY,
  "OperationElectronApp_update.json",
);

const MANUAL_ALIAS_MAP: Readonly<Record<string, string>> = {
  "37": "30",
  "45": "30",
  "48": "30",
  "54": "30",
  "36": "29",
  "44": "29",
  "47": "29",
  "43": "28",
  "68": "28",
};

export function getManualUrl(target: string): string {
  return `https://sites.google.com/belc.co.jp/operation-manual-${target}`;
}

export function getMainWindow(): BrowserWindow | null {
  const win = BrowserWindow.getAllWindows()[0];
  return win && !win.isDestroyed() ? win : null;
}

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
  } catch {
    return null;
  }
}
