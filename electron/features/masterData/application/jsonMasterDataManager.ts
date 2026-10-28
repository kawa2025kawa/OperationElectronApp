// electron/features/masterData/application/jsonMasterDataManager.ts

import type { JsonMasterData } from "@shared/types/masterData/jsonMasterDataTypes";
import {
  deleteMasterDataFileCache,
  loadMasterDataFileCache,
  saveMasterDataFileCache,
} from "../infrastructure/masterDataFileCache";
import { loadJsonMasterData } from "../infrastructure/jsonMasterLoader";
import { normalizeMasterDataRows } from "../infrastructure/masterDataNormalizer";
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

// JSON マスターデータの各配列に含まれる文字列を正規化する。
function normalizeData(data: JsonMasterData): JsonMasterData {
  return {
    operations: normalizeMasterDataRows(data.operations ?? []),
    irregulars: normalizeMasterDataRows(data.irregulars ?? []),
    todayIrregulars: normalizeMasterDataRows(data.todayIrregulars ?? []),
    rdps: normalizeMasterDataRows(data.rdps ?? []),
  };
}

// 最新データを取得し、当日分の抽出後に全配列を正規化する。
async function loadFreshJsonMasterData(): Promise<JsonMasterData> {
  const data = await loadJsonMasterData();

  return normalizeData({
    ...data,
    todayIrregulars: buildTodayIrregulars(data.irregulars),
  });
}

const jsonMasterDataCache = createMasterDataCacheService<JsonMasterData>({
  loadCache: async () => {
    const cached = await loadMasterDataFileCache(
      CACHE_FILE_NAME,
      CACHE_VERSION,
      isJsonMasterData,
    );

    if (!cached) {
      return null;
    }

    return {
      ...cached,
      data: normalizeData(cached.data),
    };
  },
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
