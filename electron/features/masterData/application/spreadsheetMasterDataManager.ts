// electron/features/masterData/application/spreadsheetMasterDataManager.ts

import {
  SPREADSHEET_MASTER_DATA_KEYS,
  type SpreadsheetMasterData,
} from "../types/internalSpreadsheetMasterDataTypes";
import {
  deleteMasterDataFileCache,
  loadMasterDataFileCache,
  saveMasterDataFileCache,
} from "../infrastructure/masterDataFileCache";
import { normalizeSpreadsheetMasterData } from "../infrastructure/spreadsheetDataNormalizer";
import { loadSpreadsheetMasterData } from "../infrastructure/spreadsheetMasterLoader";
import { buildTodayIrregulars } from "./todayIrregularFilter";
import { createMasterDataCacheService } from "./masterDataCacheService";

const SPREADSHEET_MASTER_CACHE_CONFIG = {
  fileName: "spreadsheet-master-data.json",
  version: 3,
  logPrefix: "[SpreadsheetMasterDataManager]",
} as const;

function isSpreadsheetMasterData(
  value: unknown,
): value is SpreadsheetMasterData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return SPREADSHEET_MASTER_DATA_KEYS.every((key) => Array.isArray(data[key]));
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
        SPREADSHEET_MASTER_CACHE_CONFIG.fileName,
        SPREADSHEET_MASTER_CACHE_CONFIG.version,
        isSpreadsheetMasterData,
      );

      return cached ? { ...cached, data: normalizeData(cached.data) } : null;
    },
    saveCache: (data) =>
      saveMasterDataFileCache(
        SPREADSHEET_MASTER_CACHE_CONFIG.fileName,
        SPREADSHEET_MASTER_CACHE_CONFIG.version,
        data,
      ),
    deleteCache: () =>
      deleteMasterDataFileCache(SPREADSHEET_MASTER_CACHE_CONFIG.fileName),
    loadFreshData: async () => normalizeData(await loadSpreadsheetMasterData()),
    logPrefix: SPREADSHEET_MASTER_CACHE_CONFIG.logPrefix,
  });

export async function getSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  return spreadsheetMasterDataCache.get();
}

export async function clearSpreadsheetMasterDataCache(): Promise<void> {
  await spreadsheetMasterDataCache.clear();
}
