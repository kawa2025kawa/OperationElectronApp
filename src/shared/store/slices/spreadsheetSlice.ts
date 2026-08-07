import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";
import { SPREADSHEET_CONFIGS } from "@shared/config/spreadsheetConfig";
import { SHEET_IDS, type SheetDataResponse, type SheetId } from "@shared/types/spreadsheetTypes";
import { getValueByPath } from "@shared/utils/getValueByPath";
import { fetchSheetValues } from "./helpers/spreadsheetMapper";

const EMPTY_ROWS: readonly unknown[] = [];
const ALL_SHEET_IDS = Object.keys(SPREADSHEET_CONFIGS) as SheetId[];

export interface SpreadSheetSlice {
  sheetData: Record<SheetId, SheetDataResponse | null>;
  isSheetFetching: Record<SheetId, boolean>;
  setIsSheetFetching(sheetId: SheetId, isFetching: boolean): void;
  updateSheetData(sheetId: SheetId, data: SheetDataResponse): void;
  fetchSheetData(sheetId: SheetId, forcedToken?: string, isRetry?: boolean): Promise<boolean>;
  prefetchSheets(latestToken?: string): Promise<void>;
}

const INITIAL_SHEET_DATA = Object.fromEntries(ALL_SHEET_IDS.map((id) => [id, null])) as Record<
  SheetId,
  SheetDataResponse | null
>;

const INITIAL_FETCH_STATE = Object.fromEntries(ALL_SHEET_IDS.map((id) => [id, false])) as Record<
  SheetId,
  boolean
>;

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => ({
  sheetData: INITIAL_SHEET_DATA,
  isSheetFetching: INITIAL_FETCH_STATE,

  setIsSheetFetching: (sheetId, isFetching) =>
    set((s) => {
      s.isSheetFetching[sheetId] = isFetching;
    }),

  updateSheetData: (sheetId, data) =>
    set((s) => {
      s.sheetData[sheetId] = data;
    }),

  fetchSheetData: async (sheetId, forcedToken, isRetry = false) => {
    const state = get();
    const token = forcedToken || state.accessToken;

    if (!state.isAuthenticated && !token) {
      console.warn(`[SpreadSheet] Unauthenticated access: ${sheetId}`);
      void state.logout();
      return false;
    }

    state.setIsSheetFetching(sheetId, true);
    try {
      if (token === "dev-mock-access-token") {
        state.updateSheetData(sheetId, { sheetType: "Raw", data: [] });
        return true;
      }

      const res = await fetchSheetValues(sheetId, token!);

      if (res.status === 401) {
        console.warn(`[SpreadSheet] Unauthorized (401): ${sheetId}`);
        if (isRetry) {
          toast.error("認証エラーが発生しました");
          void state.logout();
          return false;
        }
        
        // 再チェックでセッション復旧を試みる
        const isAuthOk = await state.checkAuthStatus();
        if (isAuthOk && state.accessToken) {
          return await get().fetchSheetData(sheetId, state.accessToken, true);
        }

        toast.error("セッションの有効期限が切れました");
        void state.logout();
        return false;
      }

      if (res.data) {
        state.updateSheetData(sheetId, res.data);
        return true;
      }
      throw new Error(res.errorText || "Spreadsheet Fetch Failed");
    } catch (error) {
      console.error(`[SpreadSheet] Failed to fetch: ${sheetId}`, error);
      state.updateSheetData(sheetId, { sheetType: "Raw", data: [] });
      return false;
    } finally {
      state.setIsSheetFetching(sheetId, false);
    }
  },

  prefetchSheets: async (latestToken) => {
    const [firstSheet, ...remainingSheets] = ALL_SHEET_IDS;
    const safeFetch = async (sheetId: SheetId) => {
      try {
        const success = await get().fetchSheetData(sheetId, latestToken);
        updateSheetProgress(get, sheetId, success ? "OK" : "NG");
      } catch (error) {
        console.warn(`[Sheet] Failed to prefetch: ${sheetId}`, error);
        updateSheetProgress(get, sheetId, "NG");
      }
    };

    if (firstSheet) await safeFetch(firstSheet);
    await Promise.all(remainingSheets.map(safeFetch));
  },
});

const updateSheetProgress = (get: () => AppState, sheetId: SheetId, value: "OK" | "NG"): void => {
  const store = get();
  const progressMapping: Partial<Record<SheetId, keyof typeof store.initStatus>> = {
    [SHEET_IDS.SHOP]: "store",
    [SHEET_IDS.JUGYOIN]: "jugyoin",
    [SHEET_IDS.KOKYUHYO]: "kokyuhyo",
    [SHEET_IDS.TANTOU]: "tantou",
  };
  const statusKey = progressMapping[sheetId];
  if (statusKey) {
    store.setInitStatus({ [statusKey]: value });
  }
};

export const selectFilteredSheetRows =
  <T>(sheetId: SheetId | null, searchKeys: readonly string[] = [], skipFilter = false) =>
  (state: AppState): T[] => {
    if (!sheetId) return EMPTY_ROWS as T[];
    const response = state.sheetData[sheetId];
    if (!response) return EMPTY_ROWS as T[];

    const rows = response.data as T[];
    if (rows.length === 0 || skipFilter) return rows;

    const searchTerm = state.searchTerm.trim().toLowerCase();
    if (searchTerm.length === 0 || searchKeys.length === 0) return rows;

    return rows.filter((row) =>
      searchKeys.some((key) => {
        const value = getValueByPath(row as Record<string, unknown>, key);
        return value != null && String(value).toLowerCase().includes(searchTerm);
      }),
    );
  };
