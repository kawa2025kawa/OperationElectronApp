// src/renderer/store/slices/spreadsheetSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type {
  SpreadsheetDailyUpdateStatus,
  SpreadsheetMasterDataResponse,
} from "@shared/types/masterData/spreadsheetMasterDataTypes";
import {
  SHEETS,
  type SheetData,
  type SheetDataResponse,
  type SheetDataState,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { spreadsheetIpcService } from "@renderer/services/spreadsheetIpcService";
import { toErrorMessage } from "@renderer/utils/errorUtils";

const SHEET_IDS = Object.values(SHEETS).map(
  ({ sheetName }) => sheetName,
) as SheetId[];

function createSheetState<T>(value: T): Record<SheetId, T> {
  return Object.fromEntries(
    SHEET_IDS.map((sheetId) => [sheetId, value]),
  ) as Record<SheetId, T>;
}

function resolveSheetEntry<TSheetId extends SheetId>(
  sheetId: TSheetId,
  data: SheetData<TSheetId>,
  errors: Partial<Record<SheetId, string>>,
): SheetDataResponse<TSheetId> | null {
  return errors[sheetId] ? null : { sheetId, data };
}

export interface SpreadSheetSlice {
  sheetData: SheetDataState;
  sheetErrors: Partial<Record<SheetId, string>>;
  dailyUpdateStatus: SpreadsheetDailyUpdateStatus | null;

  updateSheetData<TSheetId extends SheetId>(
    sheetId: TSheetId,
    data: SheetDataResponse<TSheetId>,
  ): void;

  fetchMasterData(): Promise<SpreadsheetMasterDataResponse | null>;
  clearMasterData(): void;
}

export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => {
  const updateSheetData = <TSheetId extends SheetId>(
    sheetId: TSheetId,
    data: SheetDataResponse<TSheetId>,
  ): void => {
    set((state) => {
      state.sheetData[sheetId] = data as never;
      delete state.sheetErrors[sheetId];
    });
  };

  const clearMasterData = (): void => {
    set((state) => {
      state.sheetData = createSheetState(null) as SheetDataState;
      state.sheetErrors = {};
      state.dailyUpdateStatus = null;
    });
  };

  const applyMasterData = (masterData: SpreadsheetMasterDataResponse): void => {
    const { errors } = masterData;
    set((state) => {
      state.sheetErrors = { ...errors };
      state.dailyUpdateStatus = masterData.dailyUpdateStatus;

      state.sheetData[SHEETS.STORE.sheetName] = resolveSheetEntry(
        SHEETS.STORE.sheetName,
        masterData.stores,
        errors,
      );
      state.sheetData[SHEETS.KOKYUHYO.sheetName] = resolveSheetEntry(
        SHEETS.KOKYUHYO.sheetName,
        masterData.kokyuhyos,
        errors,
      );
      state.sheetData[SHEETS.JUGYOIN.sheetName] = resolveSheetEntry(
        SHEETS.JUGYOIN.sheetName,
        masterData.jugyoin,
        errors,
      );
      state.sheetData[SHEETS.KOKYUHYO_TANTOU.sheetName] = resolveSheetEntry(
        SHEETS.KOKYUHYO_TANTOU.sheetName,
        masterData.kokyuhyoTantous,
        errors,
      );
    });
  };

  const syncInitStatus = (
    isUpdatedToday: boolean,
    errors?: Partial<Record<SheetId, string>>,
  ): void => {
    const statusFor = (sheetId: SheetId): "OK" | "NG" =>
      errors && !errors[sheetId] ? "OK" : "NG";

    get().setInitStatus({
      sheetSync: isUpdatedToday ? "OK" : "NG",
      store: statusFor(SHEETS.STORE.sheetName),
      kokyuhyo: statusFor(SHEETS.KOKYUHYO.sheetName),
      jugyoin: statusFor(SHEETS.JUGYOIN.sheetName),
      tantou: statusFor(SHEETS.KOKYUHYO_TANTOU.sheetName),
      operationMaster: statusFor(SHEETS.OPERATION.sheetName),
      irregularMaster: statusFor(SHEETS.IRREGULAR.sheetName),
      rdp: statusFor(SHEETS.RDP.sheetName),
    });
  };

  const fetchMasterData =
    async (): Promise<SpreadsheetMasterDataResponse | null> => {
      try {
        const masterData = await spreadsheetIpcService.getMasterData();
        applyMasterData(masterData);

        const { dailyUpdateStatus, errors } = masterData;
        syncInitStatus(dailyUpdateStatus.isUpdatedToday, errors);

        if (!dailyUpdateStatus.isUpdatedToday) {
          toast.warning(
            dailyUpdateStatus.warningMessage ??
              "スプレッドシートのデータが本日更新されていません",
            { duration: 15000 },
          );
        }

        return masterData;
      } catch (error: unknown) {
        console.error("[SpreadSheetSlice] fetchMasterData エラー詳細:", error);
        const message = toErrorMessage(
          error,
          "マスターデータの取得に失敗しました",
        );

        set((state) => {
          state.sheetErrors = createSheetState(message);
          state.sheetData = createSheetState(null) as SheetDataState;
          state.dailyUpdateStatus = null;
        });

        syncInitStatus(false);
        toast.error(message);
        return null;
      }
    };

  return {
    sheetData: createSheetState(null) as SheetDataState,
    sheetErrors: {},
    dailyUpdateStatus: null,
    updateSheetData,
    fetchMasterData,
    clearMasterData,
  };
};
