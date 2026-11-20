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
  type SheetDataResponse,
  type SheetDataState,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { spreadsheetIpcService } from "@renderer/services/spreadsheetIpcService";

const SHEET_IDS = Object.values(SHEETS).map(
  ({ sheetName }) => sheetName,
) as SheetId[];

// 全シートIDをキーとして初期値を設定したレコードを生成する。
function createSheetState<T>(value: T): Record<SheetId, T> {
  return Object.fromEntries(
    SHEET_IDS.map((sheetId) => [sheetId, value]),
  ) as Record<SheetId, T>;
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
}

// Google スプレッドシート由来のマスタデータを管理するスライスを生成する。
export const createSpreadSheetSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  SpreadSheetSlice
> = (set, get) => {
  // 指定シートIDのデータを最新のレスポンス内容で更新する。
  const updateSheetData = <TSheetId extends SheetId>(
    sheetId: TSheetId,
    data: SheetDataResponse<TSheetId>,
  ): void => {
    set((state) => {
      state.sheetData[sheetId] = data as never;
      delete state.sheetErrors[sheetId];
    });
  };

  // 取得したシートのうち、成功したデータだけをZustandへ反映する。
  const applyMasterData = (masterData: SpreadsheetMasterDataResponse): void => {
    set((state) => {
      state.sheetErrors = { ...masterData.errors };
      state.dailyUpdateStatus = masterData.dailyUpdateStatus;

      state.sheetData[SHEETS.STORE.sheetName] = masterData.errors[
        SHEETS.STORE.sheetName
      ]
        ? null
        : {
            sheetId: SHEETS.STORE.sheetName,
            data: masterData.stores,
          };

      state.sheetData[SHEETS.KOKYUHYO.sheetName] = masterData.errors[
        SHEETS.KOKYUHYO.sheetName
      ]
        ? null
        : {
            sheetId: SHEETS.KOKYUHYO.sheetName,
            data: masterData.kokyuhyos,
          };

      state.sheetData[SHEETS.JUGYOIN.sheetName] = masterData.errors[
        SHEETS.JUGYOIN.sheetName
      ]
        ? null
        : {
            sheetId: SHEETS.JUGYOIN.sheetName,
            data: masterData.jugyoin,
          };

      state.sheetData[SHEETS.KOKYUHYO_TANTOU.sheetName] = masterData.errors[
        SHEETS.KOKYUHYO_TANTOU.sheetName
      ]
        ? null
        : {
            sheetId: SHEETS.KOKYUHYO_TANTOU.sheetName,
            data: masterData.kokyuhyoTantous,
          };
    });
  };

  // バックエンドからマスタデータを取得し、シート単位で初期化ステータスを更新する。
  const fetchMasterData =
    async (): Promise<SpreadsheetMasterDataResponse | null> => {
      try {
        const masterData = await spreadsheetIpcService.getMasterData();

        applyMasterData(masterData);

        const errors = masterData.errors;
        const { dailyUpdateStatus } = masterData;

        get().setInitStatus({
          sheetSync: dailyUpdateStatus.isUpdatedToday ? "OK" : "NG",
          store: errors[SHEETS.STORE.sheetName] ? "NG" : "OK",
          kokyuhyo: errors[SHEETS.KOKYUHYO.sheetName] ? "NG" : "OK",
          jugyoin: errors[SHEETS.JUGYOIN.sheetName] ? "NG" : "OK",
          tantou: errors[SHEETS.KOKYUHYO_TANTOU.sheetName] ? "NG" : "OK",
          operationMaster: errors[SHEETS.OPERATION.sheetName] ? "NG" : "OK",
          irregularMaster: errors[SHEETS.IRREGULAR.sheetName] ? "NG" : "OK",
          rdp: errors[SHEETS.RDP.sheetName] ? "NG" : "OK",
        });

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

        const message =
          error instanceof Error
            ? error.message
            : "マスターデータの取得に失敗しました";

        set((state) => {
          state.sheetErrors = Object.fromEntries(
            SHEET_IDS.map((sheetId) => [sheetId, message]),
          ) as Partial<Record<SheetId, string>>;

          state.sheetData = createSheetState(null) as SheetDataState;
          state.dailyUpdateStatus = null;
        });

        get().setInitStatus({
          sheetSync: "NG",
          store: "NG",
          jugyoin: "NG",
          kokyuhyo: "NG",
          tantou: "NG",
          operationMaster: "NG",
          irregularMaster: "NG",
          rdp: "NG",
        });

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
  };
};