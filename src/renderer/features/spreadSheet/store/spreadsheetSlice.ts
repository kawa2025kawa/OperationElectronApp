// src/renderer/features/spreadSheet/store/spreadsheetSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { getValueByPath } from "@shared/utils/getValueByPath";
import type { AppState } from "@shared/store";
import {
  SHEET_IDS,
  type SheetDataResponse,
  type SheetId,
} from "@shared/types/spreadsheetTypes";

import { SPREADSHEET_CONFIGS } from "../config/spreadsheetConfig";
import { fetchSheetValues } from "../helpers/spreadsheetMapper";

// =====================================================
// Constants
// =====================================================

const DEV_MOCK_ACCESS_TOKEN = "dev-mock-access-token";

const EMPTY_ROWS: readonly unknown[] = [];

const ALL_SHEET_IDS = Object.keys(SPREADSHEET_CONFIGS) as SheetId[];

// =====================================================
// Initial State
// =====================================================

const INITIAL_SHEET_DATA = Object.fromEntries(
  ALL_SHEET_IDS.map((sheetId) => [sheetId, null]),
) as Record<SheetId, SheetDataResponse | null>;

const INITIAL_FETCH_STATE = Object.fromEntries(
  ALL_SHEET_IDS.map((sheetId) => [sheetId, false]),
) as Record<SheetId, boolean>;

// =====================================================
// Types
// =====================================================

export interface SpreadSheetSlice {
  sheetData: Record<SheetId, SheetDataResponse | null>;

  isSheetFetching: Record<SheetId, boolean>;

  setIsSheetFetching(sheetId: SheetId, isFetching: boolean): void;

  updateSheetData(sheetId: SheetId, data: SheetDataResponse): void;

  fetchSheetData(
    sheetId: SheetId,
    forcedToken?: string,
    isRetry?: boolean,
  ): Promise<boolean>;

  prefetchSheets(latestToken?: string): Promise<void>;
}

// =====================================================
// Helpers
// =====================================================

function createEmptySheetData(): SheetDataResponse {
  return {
    sheetType: "Raw",
    data: [],
  };
}

function updateSheetProgress(
  get: () => AppState,
  sheetId: SheetId,
  value: "OK" | "NG",
): void {
  const progressMapping: Partial<
    Record<SheetId, keyof AppState["initStatus"]>
  > = {
    [SHEET_IDS.SHOP]: "store",
    [SHEET_IDS.JUGYOIN]: "jugyoin",
    [SHEET_IDS.KOKYUHYO]: "kokyuhyo",
    [SHEET_IDS.TANTOU]: "tantou",
  };

  const statusKey = progressMapping[sheetId];

  if (!statusKey) {
    return;
  }

  get().setInitStatus({
    [statusKey]: value,
  });
}

// =====================================================
// Slice
// =====================================================

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => ({
  // ---------------------------------------------------
  // Initial State
  // ---------------------------------------------------

  sheetData: INITIAL_SHEET_DATA,
  isSheetFetching: INITIAL_FETCH_STATE,

  // ---------------------------------------------------
  // Setters
  // ---------------------------------------------------

  setIsSheetFetching: (sheetId, isFetching) => {
    set((state: AppState) => {
      state.isSheetFetching[sheetId] = isFetching;
    });
  },

  updateSheetData: (sheetId, data) => {
    set((state: AppState) => {
      state.sheetData[sheetId] = data;
    });
  },

  // ---------------------------------------------------
  // Fetch
  // ---------------------------------------------------

  fetchSheetData: async (
    sheetId,
    forcedToken,
    isRetry = false,
  ): Promise<boolean> => {
    const state = get();
    const token = forcedToken ?? state.accessToken;

    if (!token) {
      console.warn(`[SpreadSheet] Access token is missing: ${sheetId}`);

      await state.logout();
      return false;
    }

    state.setIsSheetFetching(sheetId, true);

    try {
      if (token === DEV_MOCK_ACCESS_TOKEN) {
        state.updateSheetData(sheetId, createEmptySheetData());

        return true;
      }

      const result = await fetchSheetValues(sheetId, token);

      // -----------------------------------------------
      // Unauthorized
      // -----------------------------------------------

      if (result.status === 401) {
        console.warn(`[SpreadSheet] Unauthorized (401): ${sheetId}`);

        if (isRetry) {
          toast.error("認証エラーが発生しました");
          await state.logout();
          return false;
        }

        const authSucceeded = await state.checkAuthStatus();

        if (authSucceeded) {
          const refreshedToken = get().accessToken;

          if (refreshedToken) {
            return get().fetchSheetData(sheetId, refreshedToken, true);
          }
        }

        toast.error("セッションの有効期限が切れました");

        await state.logout();

        return false;
      }

      // -----------------------------------------------
      // API Error
      // -----------------------------------------------

      if (!result.data) {
        throw new Error(
          result.errorText || `Spreadsheet fetch failed: ${result.status}`,
        );
      }

      // -----------------------------------------------
      // Success
      // -----------------------------------------------

      state.updateSheetData(sheetId, result.data);

      return true;
    } catch (error) {
      console.error(`[SpreadSheet] Failed to fetch: ${sheetId}`, error);

      state.updateSheetData(sheetId, createEmptySheetData());

      return false;
    } finally {
      state.setIsSheetFetching(sheetId, false);
    }
  },

  // ---------------------------------------------------
  // Prefetch
  // ---------------------------------------------------

  prefetchSheets: async (latestToken): Promise<void> => {
    const [firstSheet, ...remainingSheets] = ALL_SHEET_IDS;

    const safeFetch = async (sheetId: SheetId): Promise<void> => {
      try {
        const success = await get().fetchSheetData(sheetId, latestToken);

        updateSheetProgress(get, sheetId, success ? "OK" : "NG");
      } catch (error) {
        console.warn(`[Sheet] Failed to prefetch: ${sheetId}`, error);

        updateSheetProgress(get, sheetId, "NG");
      }
    };

    // 最初のシートだけ先に取得し、
    // 残りは並列取得する。
    if (firstSheet) {
      await safeFetch(firstSheet);
    }

    await Promise.all(remainingSheets.map(safeFetch));
  },
});

// =====================================================
// Selectors
// =====================================================

export const selectFilteredSheetRows =
  <T>(
    sheetId: SheetId | null,
    searchKeys: readonly string[] = [],
    skipFilter = false,
  ) =>
  (state: AppState): T[] => {
    if (!sheetId) {
      return EMPTY_ROWS as T[];
    }

    const response = state.sheetData[sheetId];

    if (!response) {
      return EMPTY_ROWS as T[];
    }

    const rows = response.data as T[];

    if (rows.length === 0 || skipFilter || searchKeys.length === 0) {
      return rows;
    }

    const searchTerm = state.searchTerm.trim().toLowerCase();

    if (!searchTerm) {
      return rows;
    }

    return rows.filter((row) =>
      searchKeys.some((key) => {
        const value = getValueByPath(row as Record<string, unknown>, key);

        return (
          value != null && String(value).toLowerCase().includes(searchTerm)
        );
      }),
    );
  };
