// electron/features/masterData/application/spreadsheetMasterDataManager.ts

import {
  SPREADSHEET_MASTER_DATA_ARRAY_KEYS,
  type SpreadsheetMasterData,
} from "../types/internalSpreadsheetMasterDataTypes";
import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
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
  version: 4,
  logPrefix: "[SpreadsheetMasterDataManager]",
} as const;

function isSpreadsheetMasterData(
  value: unknown,
): value is SpreadsheetMasterData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  const hasValidArrays = SPREADSHEET_MASTER_DATA_ARRAY_KEYS.every((key) =>
    Array.isArray(data[key]),
  );

  if (!hasValidArrays) {
    return false;
  }

  if (
    typeof data.errors !== "object" ||
    data.errors === null ||
    Array.isArray(data.errors)
  ) {
    return false;
  }

  return Object.values(data.errors).every((error) => typeof error === "string");
}

// 取得データ・キャッシュデータを正規化し、当日対象を生成する。
function normalizeData(data: SpreadsheetMasterData): SpreadsheetMasterData {
  const normalized = normalizeSpreadsheetMasterData(data);

  return {
    ...normalized,
    todayIrregulars: normalized.errors[SHEETS.IRREGULAR.sheetName]
      ? []
      : buildTodayIrregulars(normalized.irregulars),
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
    shouldCache: (data) => Object.keys(data.errors).length === 0,
    logPrefix: SPREADSHEET_MASTER_CACHE_CONFIG.logPrefix,
  });

export async function getSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  return spreadsheetMasterDataCache.get();
}

export async function clearSpreadsheetMasterDataCache(): Promise<void> {
  await spreadsheetMasterDataCache.clear();
}

/** 指定シートの取得失敗を呼び出し元へ通知する。 */
export function assertSpreadsheetSheetsLoaded(
  data: SpreadsheetMasterData,
  sheetIds: readonly SheetId[],
): void {
  const failures = sheetIds
    .map((sheetId) => data.errors[sheetId])
    .filter((error): error is string => Boolean(error));

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}
