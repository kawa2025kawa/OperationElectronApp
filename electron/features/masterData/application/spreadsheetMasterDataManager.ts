// electron/features/masterData/application/spreadsheetMasterDataManager.ts

import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import { getValueByPath } from "@shared/utils/getValueByPath";
import {
  loadSpreadsheetMasterDataCache,
  saveSpreadsheetMasterDataCache,
  deleteSpreadsheetMasterDataCache,
} from "../infrastructure/spreadsheetMasterStorage";
import { loadSpreadsheetMasterData } from "../infrastructure/spreadsheetMasterLoader";
import {
  clearSpreadsheetMasterMemoryCache,
  getSpreadsheetMasterMemoryCache,
  setSpreadsheetMasterMemoryCache,
} from "./spreadsheetMasterMemoryCache";

const JST_TIME_ZONE = "Asia/Tokyo";

let refreshPromise: Promise<SpreadsheetMasterData> | null = null;
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

function normalizeData(data: SpreadsheetMasterData): SpreadsheetMasterData {
  return {
    stores: data.stores ?? [],
    kokyuhyos: data.kokyuhyos ?? [],
    jugyoin: data.jugyoin ?? [],
    kokyuhyoTantous: data.kokyuhyoTantous ?? [],
  };
}

function getSheetRows(
  data: SpreadsheetMasterData,
  sheetName: string,
): readonly object[] {
  switch (sheetName) {
    case SHEETS.STORE.sheetName:
      return data.stores;
    case SHEETS.KOKYUHYO.sheetName:
      return data.kokyuhyos;
    case SHEETS.JUGYOIN.sheetName:
      return data.jugyoin;
    case SHEETS.KOKYUHYO_TANTOU.sheetName:
      return data.kokyuhyoTantous;
    default:
      throw new Error(`シートが存在しません: ${sheetName}`);
  }
}

export async function getSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  if (clearPromise) {
    await clearPromise;
    return getSpreadsheetMasterData();
  }

  const memoryCache = getSpreadsheetMasterMemoryCache();

  if (
    memoryCache.data &&
    memoryCache.fetchedAt &&
    isSameJstDay(memoryCache.fetchedAt)
  ) {
    return memoryCache.data;
  }

  const generationAtReadStart = cacheGeneration;
  const cached = await loadSpreadsheetMasterDataCache();

  if (generationAtReadStart !== cacheGeneration) {
    return getSpreadsheetMasterData();
  }

  if (clearPromise) {
    await clearPromise;
    return getSpreadsheetMasterData();
  }

  if (cached && isSameJstDay(cached.fetchedAt)) {
    setSpreadsheetMasterMemoryCache(cached.data, cached.fetchedAt);
    return cached.data;
  }

  return refreshSpreadsheetMasterData();
}

async function refreshSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  if (clearPromise) {
    await clearPromise;
    return refreshSpreadsheetMasterData();
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const currentRefresh = (async () => {
    const data = normalizeData(await loadSpreadsheetMasterData());

    await saveSpreadsheetMasterDataCache(data);

    const fetchedAt = new Date().toISOString();
    setSpreadsheetMasterMemoryCache(data, fetchedAt);

    return data;
  })();

  refreshPromise = currentRefresh;

  try {
    return await currentRefresh;
  } catch (err) {
    console.error("[SpreadsheetMasterDataManager] 更新に失敗:", err);
    throw err;
  } finally {
    if (refreshPromise === currentRefresh) {
      refreshPromise = null;
    }
  }
}

export async function getFilteredSheetData<T>(
  sheetName: string,
  searchTerm = "",
  searchKeys: string[] = [],
): Promise<T[]> {
  const data = await getSpreadsheetMasterData();
  const source = getSheetRows(data, sheetName);
  const term = searchTerm.trim();

  if (!term) {
    return [...source] as T[];
  }

  const keys =
    searchKeys.length > 0 ? searchKeys : Object.keys(source[0] ?? {});

  const normalizedTerm = term.toLocaleLowerCase();

  return source.filter((item) =>
    keys.some((key) =>
      getValueByPath(item, key).toLocaleLowerCase().includes(normalizedTerm),
    ),
  ) as T[];
}
