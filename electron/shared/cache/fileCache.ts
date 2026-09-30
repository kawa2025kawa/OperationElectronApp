// electron/shared/cache/fileCache.ts

import fs from "node:fs";
import path from "node:path";

import { app } from "electron";

export function getTodayString(): string {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCacheFilePath(fileName: string): string {
  return path.join(app.getPath("userData"), fileName);
}

export function loadCache<T>(fileName: string): T | null {
  const filePath = getCacheFilePath(fileName);

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    console.error(`[fileCache] Failed to load cache: ${fileName}`, error);

    return null;
  }
}

export function saveCache<T>(fileName: string, data: T): boolean {
  const filePath = getCacheFilePath(fileName);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    return true;
  } catch (error) {
    console.error(`[fileCache] Failed to save cache: ${fileName}`, error);

    return false;
  }
}
