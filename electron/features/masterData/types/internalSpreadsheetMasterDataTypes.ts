// electron/features/masterData/types/internalSpreadsheetMasterDataTypes.ts

import type { SpreadsheetDailyUpdateStatus } from "@shared/types/masterData/spreadsheetMasterDataTypes";
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
import type { RdpMaster } from "../../rdp/rdpMasterTypes";

export interface SpreadsheetMasterData {
  stores: SheetData<typeof SHEETS.STORE.sheetName>;
  kokyuhyos: SheetData<typeof SHEETS.KOKYUHYO.sheetName>;
  jugyoin: SheetData<typeof SHEETS.JUGYOIN.sheetName>;
  kokyuhyoTantous: SheetData<typeof SHEETS.KOKYUHYO_TANTOU.sheetName>;
  operations: OperationMaster[];
  irregulars: IrregularMaster[];
  todayIrregulars: TodayIrregularMaster[];
  rdps: RdpMaster[];
  dailyUpdateStatus: SpreadsheetDailyUpdateStatus;
  errors: Partial<Record<SheetId, string>>;
}