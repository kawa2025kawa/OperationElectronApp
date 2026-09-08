import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type { SheetDataResponse } from "@shared/types/spreadsheet";
import {
  ALL_SHEET_IDS,
  type SheetId,
} from "@renderer/features/spreadSheet/services/spreadsheetConfig";
import { fetchSheetValues } from "../services/mappers";

const PROGRESS_MAPPING: Partial<Record<SheetId, keyof AppState["initStatus"]>> =
  {
    StoreMasterData: "store",
    JugyoinList: "jugyoin",
    KokyuhyoMasterData: "kokyuhyo",
    KokyuhyoTantouMasterData: "tantou",
  };

export interface SpreadSheetSlice {
  sheetData: Record<SheetId, SheetDataResponse | null>;
  isSheetFetching: Record<SheetId, boolean>;
  sheetErrors: Record<SheetId, string | null>;

  setIsSheetFetching(sheetId: SheetId, isFetching: boolean): void;
  updateSheetData(sheetId: SheetId, data: SheetDataResponse): void;
  setSheetError(sheetId: SheetId, error: string | null): void;

  fetchSheetData(
    sheetId: SheetId,
    forcedToken?: string | null,
    isRetry?: boolean,
    forceFetch?: boolean,
  ): Promise<boolean>;

  prefetchSheets(latestToken?: string, concurrency?: number): Promise<void>;
}

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => ({
  sheetData: Object.fromEntries(
    ALL_SHEET_IDS.map((id) => [id, null]),
  ) as Record<SheetId, SheetDataResponse | null>,

  isSheetFetching: Object.fromEntries(
    ALL_SHEET_IDS.map((id) => [id, false]),
  ) as Record<SheetId, boolean>,

  sheetErrors: Object.fromEntries(
    ALL_SHEET_IDS.map((id) => [id, null]),
  ) as Record<SheetId, string | null>,

  setIsSheetFetching: (sheetId, isFetching) => {
    set((state) => {
      state.isSheetFetching[sheetId] = isFetching;
    });
  },

  updateSheetData: (sheetId, data) => {
    set((state) => {
      state.sheetData[sheetId] = data;
      state.sheetErrors[sheetId] = null;
    });
  },

  setSheetError: (sheetId, error) => {
    set((state) => {
      state.sheetErrors[sheetId] = error;
    });
  },

  fetchSheetData: async (
    sheetId,
    forcedToken,
    isRetry = false,
    forceFetch = false,
  ) => {
    const currentState = get();

    if (currentState.isSheetFetching[sheetId]) {
      return false;
    }

    if (!forceFetch && currentState.sheetData[sheetId] !== null) {
      return true;
    }

    const rawToken = forcedToken ?? currentState.accessToken;

    if (!rawToken) {
      await currentState.logout();
      return false;
    }

    currentState.setIsSheetFetching(sheetId, true);

    try {
      const result = await fetchSheetValues(sheetId, rawToken);

      if (result.status === 401) {
        if (isRetry) {
          toast.error("認証エラーが発生しました");
          await currentState.logout();
          return false;
        }

        if (await currentState.checkAuthStatus()) {
          const refreshedToken = get().accessToken;

          if (refreshedToken) {
            return await get().fetchSheetData(
              sheetId,
              refreshedToken,
              true,
              forceFetch,
            );
          }
        }

        toast.error("セッションの有効期限が切れました");
        await currentState.logout();
        return false;
      }

      if (!result.data) {
        const errorMsg =
          result.status === 503
            ? "Googleサービスが一時的に利用できません (503)"
            : result.errorText || `取得エラー (Status: ${result.status})`;

        throw new Error(errorMsg);
      }

      get().updateSheetData(sheetId, result.data);
      return true;
    } catch (err: unknown) {
      console.error(`[SpreadSheet] Failed to fetch sheet [${sheetId}]:`, err);

      const message =
        err instanceof Error ? err.message : "データ取得に失敗しました";

      get().setSheetError(sheetId, message);
      toast.error(`[${sheetId}] ${message}`);

      return false;
    } finally {
      get().setIsSheetFetching(sheetId, false);
    }
  },

  prefetchSheets: async (latestToken, concurrency = 2) => {
    const ids = [...ALL_SHEET_IDS];
    const executing = new Set<Promise<void>>();

    for (const id of ids) {
      const task = (async () => {
        const ok = await get().fetchSheetData(id, latestToken);
        const key = PROGRESS_MAPPING[id];

        if (key) {
          get().setInitStatus({
            [key]: ok ? "OK" : "NG",
          });
        }
      })();

      executing.add(task);

      const clean = () => executing.delete(task);
      task.then(clean, clean);

      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  },
});
