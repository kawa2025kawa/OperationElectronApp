//src\shared\types\spreadsheet\spreadsheetTypes.ts

import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";

/* =========================
 * Spreadsheet ID
 * ========================= */

export const SPREADSHEET_ID = {
  MASTER: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
} as const;

/* =========================
 * Sheet Definitions
 * ========================= */

export const SHEETS = {
  STORE: {
    sheetName: "StoreMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  KOKYUHYO: {
    sheetName: "KokyuhyoMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  JUGYOIN: {
    sheetName: "JugyoinMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  KOKYUHYO_TANTOU: {
    sheetName: "KokyuhyoTantouMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  OPERATION: {
    sheetName: "OperationMasterList",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  IRREGULAR: {
    sheetName: "IrregularMasterList",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  TODAY_IRREGULAR: {
    sheetName: "TodayIrregularMasterList",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  RDP: {
    sheetName: "RdpMasterList",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
} as const;

/* =========================
 * Spreadsheet Master
 * ========================= */

export interface OperationMaster {
  kanriNo: string;
  scheduledTime: string;
  workName: string;
  jobId: string;
  dependsOn: string;
  manualUrl: string;
  AutoManualUrl: string;
  link: string;
  other1: string;
  other2: string;
}

export interface IrregularMaster {
  kanriNo: string;
  scheduledTime: string;
  dateRule: string;
  weekdayRule: string;
  weekRule: string;
  monthRule: string;
  workName: string;
  dependsOn: string;
  manualUrl: string;
  AutoManualUrl: string;
  link: string;
  other1: string;
  other2: string;
}

export type TodayIrregularMaster = IrregularMaster;

export interface RdpMaster {
  name: string;
  ipAddress: string;
  userName: string;
  password: string;
}

/* =========================
 * Sheet Mapping
 * ========================= */

type SheetDefinition = (typeof SHEETS)[keyof typeof SHEETS];

export type SheetId = SheetDefinition["sheetName"];

type SheetRowMap = {
  [SHEETS.STORE.sheetName]: Shop;
  [SHEETS.KOKYUHYO.sheetName]: Kokyuhyo;
  [SHEETS.JUGYOIN.sheetName]: Jugyoin;
  [SHEETS.KOKYUHYO_TANTOU.sheetName]: Tantou;
  [SHEETS.OPERATION.sheetName]: OperationMaster;
  [SHEETS.IRREGULAR.sheetName]: IrregularMaster;
  [SHEETS.TODAY_IRREGULAR.sheetName]: TodayIrregularMaster;
  [SHEETS.RDP.sheetName]: RdpMaster;
};

export type SheetRow<TSheetId extends SheetId> = SheetRowMap[TSheetId];

export type SheetData<TSheetId extends SheetId> = SheetRow<TSheetId>[];

export interface MasterData {
  stores: SheetData<typeof SHEETS.STORE.sheetName>;
  kokyuhyos: SheetData<typeof SHEETS.KOKYUHYO.sheetName>;
  jugyoin: SheetData<typeof SHEETS.JUGYOIN.sheetName>;
  kokyuhyoTantous: SheetData<typeof SHEETS.KOKYUHYO_TANTOU.sheetName>;
  operations: SheetData<typeof SHEETS.OPERATION.sheetName>;
  irregulars: SheetData<typeof SHEETS.IRREGULAR.sheetName>;
  todayIrregulars: SheetData<typeof SHEETS.TODAY_IRREGULAR.sheetName>;
  rdps: SheetData<typeof SHEETS.RDP.sheetName>;
}

export interface MasterDataCache {
  fetchedAt: string;
  data: MasterData;
}

export type SpreadSheetEntity = SheetRow<SheetId>;

/* =========================
 * Renderer Sheet State
 * ========================= */

export interface SheetDataResponse<TSheetId extends SheetId> {
  sheetId: TSheetId;
  data: SheetData<TSheetId>;
}

export type SheetDataState = {
  [TSheetId in SheetId]: SheetDataResponse<TSheetId> | null;
};
