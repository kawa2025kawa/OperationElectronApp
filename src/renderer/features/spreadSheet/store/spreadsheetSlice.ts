// src/renderer/features/spreadSheet/store/spreadsheetSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { spreadsheetCommands } from "@renderer/services/commands";
import {
  ALL_SHEET_IDS,
  SHEETS,
  type SheetDataResponse,
  type SheetDataState,
  type SheetErrorState,
  type SheetFetchingState,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { InitStatus } from "@shared/types/initializationTypes";

const DEFAULT_CONCURRENCY = 2;

const SHEET_TO_INIT_STATUS_KEY: Partial<Record<SheetId, keyof InitStatus>> = {
  [SHEETS.OPERATION.sheetName]: "operation",
  [SHEETS.IRREGULAR.sheetName]: "irregular",
  [SHEETS.TODAY_IRREGULAR.sheetName]: "todayIrregular",
  [SHEETS.STORE.sheetName]: "store",
  [SHEETS.JUGYOIN.sheetName]: "jugyoin",
  [SHEETS.KOKYUHYO.sheetName]: "kokyuhyo",
  [SHEETS.KOKYUHYO_TANTOU.sheetName]: "tantou",
};

interface FetchSheetResult {
  success: boolean;
  unauthorized: boolean;
  error?: string;
}

function createSheetState<T>(value: T): Record<SheetId, T> {
  return Object.fromEntries(
    ALL_SHEET_IDS.map((sheetId) => [sheetId, value]),
  ) as Record<SheetId, T>;
}

export interface SpreadSheetSlice {
  sheetData: SheetDataState;
  isSheetFetching: SheetFetchingState;
  sheetErrors: SheetErrorState;

  setIsSheetFetching(sheetId: SheetId, isFetching: boolean): void;

  updateSheetData<TSheetId extends SheetId>(
    sheetId: TSheetId,
    data: SheetDataResponse<TSheetId>,
  ): void;

  setSheetError(sheetId: SheetId, error: string | null): void;

  fetchSheetData(
    sheetId: SheetId,
    isRetry?: boolean,
    forceFetch?: boolean,
  ): Promise<boolean>;

  prefetchSheets(
    sheetIds?: readonly SheetId[],
    concurrency?: number,
  ): Promise<Record<SheetId, boolean>>;
}

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => {
  const updateInitStatusForSheet = (
    sheetId: SheetId,
    status: "OK" | "NG",
  ): void => {
    const initKey = SHEET_TO_INIT_STATUS_KEY[sheetId];

    if (initKey) {
      get().setInitStatus({
        [initKey]: status,
      });
    }
  };

  const setIsSheetFetching = (sheetId: SheetId, isFetching: boolean): void => {
    set((state) => {
      state.isSheetFetching[sheetId] = isFetching;
    });
  };

  const updateOperationIds = (
    sheetId: SheetId,
    data: readonly { kanriNo: string }[],
  ): void => {
    const ids = data
      .map((item) => String(item.kanriNo ?? "").trim())
      .filter(Boolean);

    set((state) => {
      if (sheetId === SHEETS.OPERATION.sheetName) {
        state.operationIds = ids;
        return;
      }

      if (sheetId === SHEETS.IRREGULAR.sheetName) {
        state.irregularIds = ids;
        return;
      }

      if (sheetId === SHEETS.TODAY_IRREGULAR.sheetName) {
        state.todayIds = ids;
      }
    });
  };

  const updateSheetData = <TSheetId extends SheetId>(
    sheetId: TSheetId,
    data: SheetDataResponse<TSheetId>,
  ): void => {
    set((state) => {
      state.sheetData[sheetId] = data as never;
      state.sheetErrors[sheetId] = null;
    });

    if (Array.isArray(data.data)) {
      updateOperationIds(sheetId, data.data as readonly { kanriNo: string }[]);
    }
  };

  const setSheetError = (sheetId: SheetId, error: string | null): void => {
    set((state) => {
      state.sheetErrors[sheetId] = error;
    });
  };

  const fetchSheet = async (sheetId: SheetId): Promise<FetchSheetResult> => {
    const result = await spreadsheetCommands.fetchSheet(sheetId);

    if (result.unauthorized) {
      return {
        success: false,
        unauthorized: true,
      };
    }

    if (!result.success) {
      return {
        success: false,
        unauthorized: false,
        error: result.error,
      };
    }

    updateSheetData(sheetId, {
      sheetId,
      data: result.data,
    });

    return {
      success: true,
      unauthorized: false,
    };
  };

  const fetchSheetData = async (
    sheetId: SheetId,
    _isRetry = false,
    forceFetch = false,
  ): Promise<boolean> => {
    const state = get();

    if (state.isSheetFetching[sheetId]) {
      return false;
    }

    if (!forceFetch && state.sheetData[sheetId] !== null) {
      updateInitStatusForSheet(sheetId, "OK");
      return true;
    }

    setIsSheetFetching(sheetId, true);

    try {
      const result = await fetchSheet(sheetId);

      if (result.unauthorized) {
        toast.error("認証セッションが無効です。再ログインしてください.");

        updateInitStatusForSheet(sheetId, "NG");
        await get().logout();

        return false;
      }

      if (!result.success) {
        const message = result.error ?? "データ取得に失敗しました。";

        setSheetError(sheetId, message);
        updateInitStatusForSheet(sheetId, "NG");

        toast.error(`[${sheetId}] ${message}`);

        return false;
      }

      updateInitStatusForSheet(sheetId, "OK");

      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "予期せぬエラーが発生しました。";

      setSheetError(sheetId, message);
      updateInitStatusForSheet(sheetId, "NG");

      toast.error(`[${sheetId}] ${message}`);

      return false;
    } finally {
      setIsSheetFetching(sheetId, false);
    }
  };

  const prefetchSheets = async (
    sheetIds = ALL_SHEET_IDS,
    concurrency = DEFAULT_CONCURRENCY,
  ): Promise<Record<SheetId, boolean>> => {
    const results = createSheetState(false);
    const limit = Math.max(1, concurrency);

    for (let index = 0; index < sheetIds.length; index += limit) {
      const batch = sheetIds.slice(index, index + limit);

      const batchResults = await Promise.all(
        batch.map(async (sheetId) => ({
          sheetId,
          success: await fetchSheetData(sheetId),
        })),
      );

      for (const { sheetId, success } of batchResults) {
        results[sheetId] = success;
      }
    }

    return results;
  };

  return {
    sheetData: createSheetState(null) as SheetDataState,
    isSheetFetching: createSheetState(false) as SheetFetchingState,
    sheetErrors: createSheetState(null) as SheetErrorState,

    setIsSheetFetching,
    updateSheetData,
    setSheetError,
    fetchSheetData,
    prefetchSheets,
  };
};
