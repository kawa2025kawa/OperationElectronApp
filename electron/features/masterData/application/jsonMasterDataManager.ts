// electron/features/masterData/application/jsonMasterDataManager.ts

import type { JsonMasterData } from "@shared/types/masterData/jsonMasterDataTypes";
import {
  deleteMasterDataFileCache,
  loadMasterDataFileCache,
  saveMasterDataFileCache,
} from "../infrastructure/masterDataFileCache";
import { loadJsonMasterData } from "../infrastructure/jsonMasterLoader";
import { buildTodayIrregulars } from "./todayIrregularFilter";
import { createMasterDataCacheService } from "./masterDataCacheService";

const CACHE_FILE_NAME = "json-master-data.json";
const CACHE_VERSION = 1;

function isJsonMasterData(value: unknown): value is JsonMasterData {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return Array.isArray((value as Record<string, unknown>).operations);
}

function normalizeData(data: JsonMasterData): JsonMasterData {
  return {
    operations: data.operations ?? [],
    irregulars: data.irregulars ?? [],
    todayIrregulars: data.todayIrregulars ?? [],
    rdps: data.rdps ?? [],
  };
}

async function loadFreshJsonMasterData(): Promise<JsonMasterData> {
  const data = await loadJsonMasterData();
  return normalizeData({
    ...data,
    todayIrregulars: buildTodayIrregulars(data.irregulars),
  });
}

const jsonMasterDataCache = createMasterDataCacheService<JsonMasterData>({
  loadCache: () =>
    loadMasterDataFileCache(CACHE_FILE_NAME, CACHE_VERSION, isJsonMasterData),
  saveCache: (data) =>
    saveMasterDataFileCache(CACHE_FILE_NAME, CACHE_VERSION, data),
  deleteCache: () => deleteMasterDataFileCache(CACHE_FILE_NAME),
  loadFreshData: loadFreshJsonMasterData,
  logPrefix: "[JsonMasterDataManager]",
});

export async function getJsonMasterData(): Promise<JsonMasterData> {
  return jsonMasterDataCache.get();
}

export async function clearJsonMasterDataCache(): Promise<void> {
  await jsonMasterDataCache.clear();
}
