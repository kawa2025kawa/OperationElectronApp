// electron/features/masterData/application/spreadsheetMasterDataManager.ts

import type { SpreadsheetDailyUpdateStatus } from "@shared/types/spreadsheet/spreadsheetTypes";
import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import {
  SHEETS,
  type Jugyoin,
  type Kokyuhyo,
  type SheetData,
  type SheetId,
  type Shop,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { RdpMaster } from "../../rdp/rdpMasterTypes";
import { normalizeSpreadsheetMasterData } from "../infrastructure/spreadsheetDataNormalizer";
import { loadSpreadsheetMasterData } from "../infrastructure/spreadsheetMasterLoader";
import {
  buildTodayIrregulars,
  isSameJstDay,
} from "./todayIrregularFilter";

export interface SpreadsheetMasterData {
  stores: Shop[];
  kokyuhyos: Kokyuhyo[];
  jugyoin: Jugyoin[];
  kokyuhyoTantous: SheetData<typeof SHEETS.KOKYUHYO_TANTOU.sheetName>;
  operations: OperationMaster[];
  irregulars: IrregularMaster[];
  todayIrregulars: TodayIrregularMaster[];
  rdps: RdpMaster[];
  dailyUpdateStatus: SpreadsheetDailyUpdateStatus;
  errors: Partial<Record<SheetId, string>>;
}

interface MemoryCache {
  data: SpreadsheetMasterData;
  fetchedAt: string;
}

let memoryCache: MemoryCache | null = null;
let refreshPromise: Promise<SpreadsheetMasterData> | null = null;
let clearPromise: Promise<void> | null = null;

async function fetchAndNormalize(): Promise<SpreadsheetMasterData> {
  const normalized = normalizeSpreadsheetMasterData(
    await loadSpreadsheetMasterData(),
  );

  return {
    ...normalized,
    todayIrregulars: normalized.errors[SHEETS.IRREGULAR.sheetName]
      ? []
      : buildTodayIrregulars(normalized.irregulars),
  };
}

async function refresh(): Promise<SpreadsheetMasterData> {
  while (true) {
    if (clearPromise) {
      await clearPromise;
      continue;
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    const currentRefresh = (async () => {
      const data = await fetchAndNormalize();

      if (Object.keys(data.errors).length > 0) {
        memoryCache = null;
        return data;
      }

      memoryCache = {
        data,
        fetchedAt: new Date().toISOString(),
      };

      return data;
    })();

    refreshPromise = currentRefresh;

    try {
      return await currentRefresh;
    } catch (error) {
      console.error("[SpreadsheetMasterDataManager] 更新に失敗:", error);
      throw error;
    } finally {
      if (refreshPromise === currentRefresh) {
        refreshPromise = null;
      }
    }
  }
}

export async function getSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  while (true) {
    if (clearPromise) {
      await clearPromise;
      continue;
    }

    if (memoryCache !== null && isSameJstDay(memoryCache.fetchedAt)) {
      return memoryCache.data;
    }

    return refresh();
  }
}

export async function clearSpreadsheetMasterDataCache(): Promise<void> {
  if (clearPromise) {
    return clearPromise;
  }

  const pendingRefresh = refreshPromise;
  const currentClear = (async () => {
    if (pendingRefresh) {
      try {
        await pendingRefresh;
      } catch {
        // 更新失敗後も削除を続行する。
      }
    }
    memoryCache = null;
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
