// src/shared/types/spreadsheet/spreadsheetTypes.ts

import type {
  IrregularMaster,
  OperationMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpTarget } from "@shared/types/rdp/rdpTypes";

// ============================================================
// Spreadsheet Entity Types
// ============================================================

type PrinterType = "B" | "K" | "O";
type TrIndex = 1 | 2 | 3 | 4;

type ShopPrinterKeys =
  | `printerModel${PrinterType}`
  | `printerSerialNumber${PrinterType}`
  | `printerPhone${PrinterType}`
  | `printerHolidayPhone${PrinterType}`
  | `printerContractId${PrinterType}`;

type ShopTrKeys =
  | `tr${TrIndex}Name`
  | `tr${TrIndex}Ip`
  | `tr${TrIndex}Model`
  | `tr${TrIndex}LogicalName`
  | `tr${TrIndex}PhysicalName`
  | `tr${TrIndex}ImageUrl`;

type ShopBaseKeys =
  | "shopCode"
  | "shopName"
  | "shopKana"
  | "openTime"
  | "closeTime"
  | "centerName"
  | "areaName"
  | "phoneNumber"
  | "postalCode"
  | "address"
  | "mobileSales"
  | "storeManagerName"
  | "assistantManagerName1"
  | "assistantManagerName2"
  | "areaManagerName"
  | "excelFilePath"
  | "pdfFilePath"
  | "deviceCount"
  | "comment"
  | "hubImageUrl"
  | "outletImageUrl";

type ShopKey = ShopBaseKeys | ShopPrinterKeys | ShopTrKeys;

export type Shop = Record<ShopKey, string>;

export type Jugyoin = Record<
  | "id"
  | "bumon"
  | "bumonKana"
  | "name"
  | "nameKana"
  | "todayAmStatus"
  | "todayAmDetail"
  | "todayPmStatus"
  | "todayPmDetail"
  | "tomorrowAmStatus"
  | "tomorrowAmDetail"
  | "tomorrowPmStatus"
  | "tomorrowPmDetail"
  | "naisen"
  | "tanshuku"
  | "contactMobile"
  | "scheduleLink"
  | "position"
  | "email",
  string
>;

export type Kokyuhyo = Record<
  | "id"
  | "name"
  | "nameKana"
  | "todayAmStatus"
  | "todayAmDetail"
  | "todayPmStatus"
  | "todayPmDetail"
  | "tomorrowAmStatus"
  | "tomorrowAmDetail"
  | "tomorrowPmStatus"
  | "tomorrowPmDetail"
  | "naisen"
  | "tanshuku"
  | "contactMobile"
  | "scheduleLink"
  | "position"
  | "email",
  string
>;

export type Tantou = Record<
  | "id"
  | "todayHayaban"
  | "todayShikai"
  | "todayUketsuke"
  | "todayDenwa"
  | "todayNimotsu"
  | "today2F"
  | "today3F"
  | "todayTensou"
  | "todayAmAttendanceRate"
  | "todayPmAttendanceRate"
  | "tomorrowHayaban"
  | "tomorrowShikai"
  | "tomorrowUketsuke"
  | "tomorrowDenwa"
  | "tomorrowNimotsu"
  | "tomorrow2F"
  | "tomorrow3F"
  | "tomorrowTensou"
  | "tomorrowAmAttendanceRate"
  | "tomorrowPmAttendanceRate",
  string
>;

// ============================================================
// Spreadsheet Definitions
// ============================================================

const SPREADSHEET_ID = {
  MASTER: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
} as const;

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
    sheetName: "OperationMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  IRREGULAR: {
    sheetName: "IrregularMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  RDP: {
    sheetName: "RdpMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
} as const;

// ============================================================
// Spreadsheet Data Mapping
// ============================================================

type SheetDefinition = (typeof SHEETS)[keyof typeof SHEETS];

export type SheetId = SheetDefinition["sheetName"];

type SheetRowMap = {
  [SHEETS.STORE.sheetName]: Shop;
  [SHEETS.KOKYUHYO.sheetName]: Kokyuhyo;
  [SHEETS.JUGYOIN.sheetName]: Jugyoin;
  [SHEETS.KOKYUHYO_TANTOU.sheetName]: Tantou;
  [SHEETS.OPERATION.sheetName]: OperationMaster;
  [SHEETS.IRREGULAR.sheetName]: IrregularMaster;
  [SHEETS.RDP.sheetName]: RdpTarget;
};

type SheetRow<TSheetId extends SheetId> = SheetRowMap[TSheetId];

export type SheetData<TSheetId extends SheetId> = SheetRow<TSheetId>[];

export type SpreadSheetEntity = SheetRow<SheetId>;

// ============================================================
// Renderer Sheet State
// ============================================================

export interface SheetDataResponse<TSheetId extends SheetId> {
  sheetId: TSheetId;
  data: SheetData<TSheetId>;
}

export type SheetDataState = {
  [TSheetId in SheetId]: SheetDataResponse<TSheetId> | null;
};
