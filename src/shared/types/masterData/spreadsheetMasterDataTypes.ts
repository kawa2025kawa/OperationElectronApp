// src/shared/types/masterData/spreadsheetMasterDataTypes.ts

import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import type {
  SheetData,
  SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";

export interface SpreadsheetDailyUpdateStatus {
  isUpdatedToday: boolean;
  updatedAt: string | null;
  kokyuhyoUpdatedAt: string | null;
  jugyoinUpdatedAt: string | null;
  status: string | null;
  message: string | null;
  warningMessage: string | null;
}

/** Renderer に公開するスプレッドシートマスターデータ */
export interface SpreadsheetMasterDataResponse {
  stores: SheetData<typeof SHEETS.STORE.sheetName>;
  kokyuhyos: SheetData<typeof SHEETS.KOKYUHYO.sheetName>;
  jugyoin: SheetData<typeof SHEETS.JUGYOIN.sheetName>;
  kokyuhyoTantous: SheetData<typeof SHEETS.KOKYUHYO_TANTOU.sheetName>;

  operations: OperationMaster[];
  irregulars: IrregularMaster[];
  todayIrregulars: TodayIrregularMaster[];

  dailyUpdateStatus: SpreadsheetDailyUpdateStatus;

  errors: Partial<Record<SheetId, string>>;
}