// electron/features/masterData/application/spreadsheetMasterDataManager.ts

import type { SpreadsheetMasterData } from "../types/internalSpreadsheetMasterDataTypes";
import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { normalizeSpreadsheetMasterData } from "../infrastructure/spreadsheetDataNormalizer";
import { loadSpreadsheetMasterData } from "../infrastructure/spreadsheetMasterLoader";
import { buildTodayIrregulars } from "./todayIrregularFilter";
import { createMasterDataCacheService } from "./masterDataCacheService";

const SPREADSHEET_MASTER_CACHE_CONFIG = {
  logPrefix: "[SpreadsheetMasterDataManager]",
} as const;

// 取得データを正規化し、当日対象を生成する。
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
