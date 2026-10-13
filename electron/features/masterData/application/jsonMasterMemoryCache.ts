// electron/features/masterData/application/jsonMasterMemoryCache.ts

import type { JsonMasterData } from "@shared/types/masterData/jsonMasterDataTypes";

export interface JsonMasterMemoryCache {
  data: JsonMasterData | null;
  fetchedAt: string | null;
}

let cache: JsonMasterMemoryCache = {
  data: null,
  fetchedAt: null,
};

export function getJsonMasterMemoryCache(): JsonMasterMemoryCache {
  return cache;
}

export function setJsonMasterMemoryCache(
  data: JsonMasterData,
  fetchedAt: string,
): void {
  cache = { data, fetchedAt };
}

export function clearJsonMasterMemoryCache(): void {
  cache = { data: null, fetchedAt: null };
}
