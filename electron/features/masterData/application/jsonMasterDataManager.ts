// electron/features/masterData/application/jsonMasterDataManager.ts

import type { JsonMasterData } from "@shared/types/masterData/jsonMasterDataTypes";
import {
  loadJsonMasterDataCache,
  saveJsonMasterDataCache,
  deleteJsonMasterDataCache,
} from "../infrastructure/jsonMasterStorage";
import { loadJsonMasterData } from "../infrastructure/jsonMasterLoader";
import { buildTodayIrregulars } from "./todayIrregularFilter";
import {
  clearJsonMasterMemoryCache,
  getJsonMasterMemoryCache,
  setJsonMasterMemoryCache,
} from "./jsonMasterMemoryCache";

const JST_TIME_ZONE = "Asia/Tokyo";

let refreshPromise: Promise<JsonMasterData> | null = null;
let clearPromise: Promise<void> | null = null;
let cacheGeneration = 0;

function getJstDateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function isSameJstDay(value: string): boolean {
  const date = new Date(value);

  return (
    !Number.isNaN(date.getTime()) &&
    getJstDateKey(date) === getJstDateKey(new Date())
  );
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

export async function getJsonMasterData(): Promise<JsonMasterData> {
  if (clearPromise) {
    await clearPromise;
    return getJsonMasterData();
  }

  const memoryCache = getJsonMasterMemoryCache();

  if (
    memoryCache.data &&
    memoryCache.fetchedAt &&
    isSameJstDay(memoryCache.fetchedAt)
  ) {
    return memoryCache.data;
  }

  const generationAtReadStart = cacheGeneration;
  const cached = await loadJsonMasterDataCache();

  if (generationAtReadStart !== cacheGeneration) {
    return getJsonMasterData();
  }

  if (clearPromise) {
    await clearPromise;
    return getJsonMasterData();
  }

  if (cached && isSameJstDay(cached.fetchedAt)) {
    setJsonMasterMemoryCache(cached.data, cached.fetchedAt);
    return cached.data;
  }

  return refreshJsonMasterData();
}

async function refreshJsonMasterData(): Promise<JsonMasterData> {
  if (clearPromise) {
    await clearPromise;
    return refreshJsonMasterData();
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const currentRefresh = (async () => {
    const data = await loadFreshJsonMasterData();

    await saveJsonMasterDataCache(data);

    const fetchedAt = new Date().toISOString();
    setJsonMasterMemoryCache(data, fetchedAt);

    return data;
  })();

  refreshPromise = currentRefresh;

  try {
    return await currentRefresh;
  } catch (err) {
    console.error("[JsonMasterDataManager] 更新に失敗:", err);
    throw err;
  } finally {
    if (refreshPromise === currentRefresh) {
      refreshPromise = null;
    }
  }
}

export async function clearJsonMasterDataCache(): Promise<void> {
  if (clearPromise) {
    return clearPromise;
  }

  cacheGeneration += 1;
  const pendingRefresh = refreshPromise;

  const currentClear = (async () => {
    if (pendingRefresh) {
      try {
        await pendingRefresh;
      } catch {
        // 更新失敗後も削除を続行する。
      }
    }

    clearJsonMasterMemoryCache();
    await deleteJsonMasterDataCache();
  })();

  clearPromise = currentClear;

  try {
    await currentClear;
  } finally {
    if (clearPromise === currentClear) {
      clearPromise = null;
    }
  }
}
