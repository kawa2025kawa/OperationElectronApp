// src/renderer/features/spreadSheet/store/spreadsheetSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { trpc } from "@renderer/lib/trpc";
import type { AppState } from "@renderer/store";

import type { InitStatus } from "@shared/types/initializationTypes";
import {
  SHEETS,
  type MasterData,
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

const SHEET_TO_INIT_STATUS_KEY: Partial<Record<SheetId, keyof InitStatus>> = {
  [SHEETS.OPERATION.sheetName]: "operation",
  [SHEETS.IRREGULAR.sheetName]: "irregular",
  [SHEETS.TODAY_IRREGULAR.sheetName]: "todayIrregular",
  [SHEETS.STORE.sheetName]: "store",
  [SHEETS.JUGYOIN.sheetName]: "jugyoin",
  [SHEETS.KOKYUHYO.sheetName]: "kokyuhyo",
  [SHEETS.KOKYUHYO_TANTOU.sheetName]: "tantou",
};

type InitStatusValue = "OK" | "NG";

/* =========================
 * Helpers
 * ========================= */

function createSheetState<T>(value: T): Record<SheetId, T> {
  return Object.fromEntries(
    SHEET_IDS.map((sheetId) => [sheetId, value]),
  ) as Record<SheetId, T>;
}

function getInitStatusKey(sheetId: SheetId): keyof InitStatus | undefined {
  return SHEET_TO_INIT_STATUS_KEY[sheetId];
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

  fetchMasterData(): Promise<MasterData | null>;
}

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => {
  /* =========================
   * Initialization Status
   * ========================= */

  const updateInitStatusForSheet = (
    sheetId: SheetId,
    status: InitStatusValue,
  ): void => {
    const initKey = getInitStatusKey(sheetId);

    if (!initKey) {
      return;
    }

    get().setInitStatus({
      [initKey]: status,
    });
  };

  const updateInitStatusForAllSheets = (status: InitStatusValue): void => {
    for (const sheetId of SHEET_IDS) {
      updateInitStatusForSheet(sheetId, status);
    }
  };

  /* =========================
   * Operation IDs
   * ========================= */

  const updateOperationIds = (
    sheetId: SheetId,
    data: readonly { kanriNo: string }[],
  ): void => {
    const ids = data
      .map((item) => String(item.kanriNo ?? "").trim())
      .filter(Boolean);

    set((state) => {
      switch (sheetId) {
        case SHEETS.OPERATION.sheetName:
          state.operationIds = ids;
          break;

        case SHEETS.IRREGULAR.sheetName:
          state.irregularIds = ids;
          break;

        case SHEETS.TODAY_IRREGULAR.sheetName:
          state.todayIds = ids;
          break;

        default:
          break;
      }
    });
  };

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

    if (Array.isArray(data.data)) {
      updateOperationIds(sheetId, data.data as readonly { kanriNo: string }[]);
    }
  };

  /* =========================
   * Master Data
   * ========================= */

  const applyMasterData = (masterData: MasterData): void => {
    const extractIds = (data: readonly { kanriNo?: string }[]) =>
      data
        .map((item) => String(item.kanriNo ?? "").trim())
        .filter(Boolean);

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

      state.sheetData[SHEETS.OPERATION.sheetName] = {
        sheetId: SHEETS.OPERATION.sheetName,
        data: masterData.operations,
      } as never;

      state.sheetData[SHEETS.IRREGULAR.sheetName] = {
        sheetId: SHEETS.IRREGULAR.sheetName,
        data: masterData.irregulars,
      } as never;

      state.sheetData[SHEETS.TODAY_IRREGULAR.sheetName] = {
        sheetId: SHEETS.TODAY_IRREGULAR.sheetName,
        data: masterData.todayIrregulars,
      } as never;

      state.sheetData[SHEETS.RDP.sheetName] = {
        sheetId: SHEETS.RDP.sheetName,
        data: masterData.rdps,
      } as never;

      state.operationIds = extractIds(masterData.operations);
      state.irregularIds = extractIds(masterData.irregulars);
      state.todayIds = extractIds(masterData.todayIrregulars);
    });
  };

  const fetchMasterData = async (): Promise<MasterData | null> => {
    try {
      const masterData = await trpc.spreadsheet.getMasterData.query();

      applyMasterData(masterData);
      updateInitStatusForAllSheets("OK");

      return masterData;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "マスターデータの取得に失敗しました。";

      updateInitStatusForAllSheets("NG");
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
