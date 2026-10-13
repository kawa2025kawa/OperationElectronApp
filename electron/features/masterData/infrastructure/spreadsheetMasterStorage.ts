// electron/features/masterData/infrastructure/spreadsheetMasterStorage.ts

import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  SpreadsheetMasterData,
  SpreadsheetMasterDataCache,
} from "@shared/types/masterData/spreadsheetMasterDataTypes";

const FILE_NAME = "spreadsheet-master-data.json";
const CACHE_VERSION = 1;

interface VersionedSpreadsheetMasterDataCache extends SpreadsheetMasterDataCache {
  version: number;
}

function getFilePath(): string {
  return path.join(app.getPath("userData"), FILE_NAME);
}

function isSpreadsheetMasterData(
  value: unknown,
): value is SpreadsheetMasterData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    Array.isArray(data.stores) &&
    Array.isArray(data.kokyuhyos) &&
    Array.isArray(data.jugyoin) &&
    Array.isArray(data.kokyuhyoTantous)
  );
}

export async function loadSpreadsheetMasterDataCache(): Promise<SpreadsheetMasterDataCache | null> {
  try {
    const json = await fs.readFile(getFilePath(), "utf8");
    const parsed: unknown = JSON.parse(json);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const cache = parsed as Record<string, unknown>;

    if (
      cache.version !== CACHE_VERSION ||
      typeof cache.fetchedAt !== "string" ||
      !isSpreadsheetMasterData(cache.data)
    ) {
      return null;
    }

    return {
      fetchedAt: cache.fetchedAt,
      data: cache.data,
    };
  } catch {
    return null;
  }
}

export async function saveSpreadsheetMasterDataCache(
  data: SpreadsheetMasterData,
): Promise<void> {
  const filePath = getFilePath();

  const cache: VersionedSpreadsheetMasterDataCache = {
    version: CACHE_VERSION,
    fetchedAt: new Date().toISOString(),
    data,
  };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2), "utf8");
}

export async function deleteSpreadsheetMasterDataCache(): Promise<void> {
  try {
    await fs.unlink(getFilePath());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
