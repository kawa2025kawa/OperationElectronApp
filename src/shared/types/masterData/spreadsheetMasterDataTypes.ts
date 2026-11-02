// src/shared/types/masterData/spreadsheetMasterDataTypes.ts

import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";
import type { SheetData } from "@shared/types/spreadsheet/spreadsheetTypes";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";

export interface SpreadsheetMasterData {
  stores: SheetData<typeof SHEETS.STORE.sheetName>;
  kokyuhyos: SheetData<typeof SHEETS.KOKYUHYO.sheetName>;
  jugyoin: SheetData<typeof SHEETS.JUGYOIN.sheetName>;
  kokyuhyoTantous: SheetData<typeof SHEETS.KOKYUHYO_TANTOU.sheetName>;

  operations: OperationMaster[];
  irregulars: IrregularMaster[];
  todayIrregulars: TodayIrregularMaster[];
  rdps: RdpMaster[];
}

export interface SpreadsheetMasterDataCache {
  fetchedAt: string;
  data: SpreadsheetMasterData;
}
