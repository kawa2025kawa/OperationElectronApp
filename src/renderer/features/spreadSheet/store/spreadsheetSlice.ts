// src/renderer/features/spreadSheet/store/spreadsheetSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AppState } from "@renderer/store";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import {
  SHEETS,
  type SheetDataResponse,
  type SheetDataState,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";

/* =========================
 * Constants
 * ========================= */

const SHEET_IDS = Object.values(SHEETS).map(
  ({ sheetName }) => sheetName,
) as SheetId[];

/* =========================
 * Helpers
 * ========================= */

function createSheetState<T>(value: T): Record<SheetId, T> {
  return Object.fromEntries(
    SHEET_IDS.map((sheetId) => [sheetId, value]),
  ) as Record<SheetId, T>;
}

/* =========================
 * Slice
 * ========================= */

export interface SpreadSheetSlice {
  sheetData: SheetDataState;
  updateSheetData<TSheetId extends SheetId>(
    sheetId: TSheetId,
    data: SheetDataResponse<TSheetId>,
  ): void;
  fetchMasterData(): Promise<SpreadsheetMasterData | null>;
}

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => {
  /* =========================
   * Sheet Data
   * ========================= */

  const updateSheetData = <TSheetId extends SheetId>(
    sheetId: TSheetId,
    data: SheetDataResponse<TSheetId>,
  ): void => {
    set((state) => {
      state.sheetData[sheetId] = data as never;
    });
  };

  /* =========================
   * Spreadsheet Master Data
   * ========================= */

  const applyMasterData = (masterData: SpreadsheetMasterData): void => {
    set((state) => {
      state.sheetData[SHEETS.STORE.sheetName] = {
        sheetId: SHEETS.STORE.sheetName,
        data: masterData.stores,
      } as never;

      state.sheetData[SHEETS.KOKYUHYO.sheetName] = {
        sheetId: SHEETS.KOKYUHYO.sheetName,
        data: masterData.kokyuhyos,
      } as never;

      state.sheetData[SHEETS.JUGYOIN.sheetName] = {
        sheetId: SHEETS.JUGYOIN.sheetName,
        data: masterData.jugyoin,
      } as never;

      state.sheetData[SHEETS.KOKYUHYO_TANTOU.sheetName] = {
        sheetId: SHEETS.KOKYUHYO_TANTOU.sheetName,
        data: masterData.kokyuhyoTantous,
      } as never;
    });
  };

  const fetchMasterData = async (): Promise<SpreadsheetMasterData | null> => {
    try {
      const masterData = await window.electronAPI.invoke(
        IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA,
      );

      // Spreadsheet由来のデータのみをZustandへ反映する
      applyMasterData(masterData);

      get().setInitStatus({
        operation: "OK",
        irregular: "OK",
        store: "OK",
        jugyoin: "OK",
        kokyuhyo: "OK",
        tantou: "OK",
        update: "OK",
      });

      return masterData;
    } catch (error: unknown) {
      console.error("[SpreadSheetSlice] fetchMasterData エラー詳細:", error);

      const message =
        error instanceof Error
          ? error.message
          : "マスターデータの取得に失敗しました";

      get().setInitStatus({
        operation: "NG",
        irregular: "NG",
        store: "NG",
        jugyoin: "NG",
        kokyuhyo: "NG",
        tantou: "NG",
        update: "NG",
      });

      toast.error(message);
      return null;
    }
  };

  /* =========================
   * Initial State
   * ========================= */

  return {
    sheetData: createSheetState(null) as SheetDataState,
    updateSheetData,
    fetchMasterData,
  };
};
