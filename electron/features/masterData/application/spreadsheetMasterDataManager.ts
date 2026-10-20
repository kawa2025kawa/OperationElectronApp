// electron/features/masterData/application/spreadsheetMasterDataManager.ts

import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import {
  deleteMasterDataFileCache,
  loadMasterDataFileCache,
  saveMasterDataFileCache,
} from "../infrastructure/masterDataFileCache";
import { loadSpreadsheetMasterData } from "../infrastructure/spreadsheetMasterLoader";
import { createMasterDataCacheService } from "./masterDataCacheService";

const CACHE_FILE_NAME = "spreadsheet-master-data.json";
const CACHE_VERSION = 1;

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

function normalizeData(data: SpreadsheetMasterData): SpreadsheetMasterData {
  return {
    stores: data.stores ?? [],
    kokyuhyos: data.kokyuhyos ?? [],
    jugyoin: data.jugyoin ?? [],
    kokyuhyoTantous: data.kokyuhyoTantous ?? [],
  };
}

const spreadsheetMasterDataCache =
  createMasterDataCacheService<SpreadsheetMasterData>({
    loadCache: () =>
      loadMasterDataFileCache(
        CACHE_FILE_NAME,
        CACHE_VERSION,
        isSpreadsheetMasterData,
      ),
    saveCache: (data) =>
      saveMasterDataFileCache(CACHE_FILE_NAME, CACHE_VERSION, data),
    deleteCache: () => deleteMasterDataFileCache(CACHE_FILE_NAME),
    loadFreshData: async () => normalizeData(await loadSpreadsheetMasterData()),
    logPrefix: "[SpreadsheetMasterDataManager]",
  });

export async function getSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  return spreadsheetMasterDataCache.get();
}

export async function clearSpreadsheetMasterDataCache(): Promise<void> {
  await spreadsheetMasterDataCache.clear();
}
