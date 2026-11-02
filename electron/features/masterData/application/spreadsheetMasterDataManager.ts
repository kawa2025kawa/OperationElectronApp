// electron/features/masterData/application/spreadsheetMasterDataManager.ts

import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import {
  deleteMasterDataFileCache,
  loadMasterDataFileCache,
  saveMasterDataFileCache,
} from "../infrastructure/masterDataFileCache";
import { normalizeSpreadsheetMasterData } from "../infrastructure/spreadsheetDataNormalizer";
import { loadSpreadsheetMasterData } from "../infrastructure/spreadsheetMasterLoader";
import { buildTodayIrregulars } from "./todayIrregularFilter";
import { createMasterDataCacheService } from "./masterDataCacheService";

const CACHE_FILE_NAME = "spreadsheet-master-data.json";
const CACHE_VERSION = 2;

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
    Array.isArray(data.kokyuhyoTantous) &&
    Array.isArray(data.operations) &&
    Array.isArray(data.irregulars) &&
    Array.isArray(data.todayIrregulars) &&
    Array.isArray(data.rdps)
  );
}

// 取得データ・キャッシュデータを正規化し、当日対象を生成する。
function normalizeData(data: SpreadsheetMasterData): SpreadsheetMasterData {
  const normalized = normalizeSpreadsheetMasterData(data);

  return {
    ...normalized,
    todayIrregulars: buildTodayIrregulars(normalized.irregulars),
  };
}

const spreadsheetMasterDataCache =
  createMasterDataCacheService<SpreadsheetMasterData>({
    loadCache: async () => {
      const cached = await loadMasterDataFileCache(
        CACHE_FILE_NAME,
        CACHE_VERSION,
        isSpreadsheetMasterData,
      );

      return cached ? { ...cached, data: normalizeData(cached.data) } : null;
    },
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
