// src/renderer/features/spreadSheet/store/spreadsheetSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import { getValueByPath } from "@shared/utils/getValueByPath";
import type { AppState } from "@renderer/store";
import {
  SHEET_IDS,
  type SheetDataResponse,
  type SheetId,
} from "@shared/types/spreadsheetTypes";
import { fetchSheetValues } from "../helpers/spreadsheetMapper";
import { ALL_SHEET_IDS } from "../services/spreadsheetConfig";

const EMPTY_ROWS: readonly unknown[] = [];

const PROGRESS_MAPPING: Partial<Record<SheetId, keyof AppState["initStatus"]>> =
  {
    [SHEET_IDS.SHOP]: "store",
    [SHEET_IDS.JUGYOIN]: "jugyoin",
    [SHEET_IDS.KOKYUHYO]: "kokyuhyo",
    [SHEET_IDS.TANTOU]: "tantou",
  };

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

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => ({
  sheetData: Object.fromEntries(
    ALL_SHEET_IDS.map((id: SheetId) => [id, null]),
  ) as Record<SheetId, SheetDataResponse | null>,
  isSheetFetching: Object.fromEntries(
    ALL_SHEET_IDS.map((id: SheetId) => [id, false]),
  ) as Record<SheetId, boolean>,

  setIsSheetFetching: (sheetId, isFetching) => {
    set((state) => {
      state.isSheetFetching[sheetId] = isFetching;
    });
  },

  updateSheetData: (sheetId, data) => {
    set((state) => {
      state.sheetData[sheetId] = data;
    });
  },

  fetchSheetData: async (sheetId, forcedToken, isRetry = false) => {
    const state = get();
    const token = forcedToken ?? state.accessToken;

    if (!token) {
      await state.logout();
      return false;
    }

    state.setIsSheetFetching(sheetId, true);

    try {
      const result = await fetchSheetValues(sheetId, token);

      if (result.status === 401) {
        if (isRetry) {
          toast.error("認証エラーが発生しました");
          await state.logout();
          return false;
        }

        if (await state.checkAuthStatus()) {
          const refreshedToken = get().accessToken;
          if (refreshedToken)
            return get().fetchSheetData(sheetId, refreshedToken, true);
        }

        toast.error("セッションの有効期限が切れました");
        await state.logout();
        return false;
      }

      if (!result.data) {
        throw new Error(
          result.errorText || `Fetch failed with status: ${result.status}`,
        );
      }

      state.updateSheetData(sheetId, result.data);
      return true;
    } catch (error) {
      console.error(`[SpreadSheet] Failed to fetch sheet [${sheetId}]:`, error);
      state.updateSheetData(sheetId, { sheetType: "Raw", data: [] });
      return false;
    } finally {
      state.setIsSheetFetching(sheetId, false);
    }
  },

  prefetchSheets: async (latestToken) => {
    const [first, ...rest] = ALL_SHEET_IDS;
    const safeFetch = async (id: SheetId) => {
      const ok = await get().fetchSheetData(id, latestToken);
      const key = PROGRESS_MAPPING[id];
      if (key) get().setInitStatus({ [key]: ok ? "OK" : "NG" });
    };

    if (first) await safeFetch(first);
    await Promise.all(rest.map(safeFetch));
  },
});

const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === "object" && val !== null;

const containsTerm = (obj: unknown, term: string): boolean => {
  if (obj == null) return false;
  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    return String(obj).toLowerCase().includes(term);
  }
  if (Array.isArray(obj)) {
    return obj.some((item) => containsTerm(item, term));
  }
  if (isObject(obj)) {
    return Object.values(obj).some((val) => containsTerm(val, term));
  }
  return false;
};

export const selectFilteredSheetRows =
  <T>(
    sheetId: SheetId | null,
    searchKeys: readonly string[] = [],
    skipFilter = false,
  ) =>
  (state: AppState): T[] => {
    if (!sheetId || !state.sheetData[sheetId]) return EMPTY_ROWS as T[];

    const rows = state.sheetData[sheetId]?.data as T[];
    if (!rows || rows.length === 0 || skipFilter)
      return rows ?? (EMPTY_ROWS as T[]);

    const term = state.searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      if (searchKeys.length > 0) {
        const keyMatch = searchKeys.some((key) => {
          const val = getValueByPath(row as Record<string, unknown>, key);
          return val != null && String(val).toLowerCase().includes(term);
        });
        if (keyMatch) return true;
      }
      return containsTerm(row, term);
    });
  };
