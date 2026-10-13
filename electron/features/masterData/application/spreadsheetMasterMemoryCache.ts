// electron/features/masterData/application/spreadsheetMasterMemoryCache.ts

import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";

export interface SpreadsheetMasterMemoryCache {
  data: SpreadsheetMasterData | null;
  fetchedAt: string | null;
}

let cache: SpreadsheetMasterMemoryCache = {
  data: null,
  fetchedAt: null,
};

export function getSpreadsheetMasterMemoryCache(): SpreadsheetMasterMemoryCache {
  return cache;
}

export function setSpreadsheetMasterMemoryCache(
  data: SpreadsheetMasterData,
  fetchedAt: string,
): void {
  cache = { data, fetchedAt };
}

export function clearSpreadsheetMasterMemoryCache(): void {
  cache = { data: null, fetchedAt: null };
}
