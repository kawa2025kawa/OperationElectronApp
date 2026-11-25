// src/shared/types/spreadsheet/spreadsheetTypes.ts

import type {
  IrregularMaster,
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";

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

export type Shop = Record<ShopBaseKeys | ShopPrinterKeys | ShopTrKeys, string>;

export type ShopResourceKey =
  | "tr1ImageUrl"
  | "tr2ImageUrl"
  | "tr3ImageUrl"
  | "tr4ImageUrl"
  | "hubImageUrl"
  | "outletImageUrl"
  | "excelFilePath"
  | "pdfFilePath";

export type PublicShop = Omit<Shop, ShopResourceKey> & {
  availableResources: Partial<Record<ShopResourceKey, boolean>>;
};

type StaffScheduleBaseKey =
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
  | "email";

export type StaffHiddenKey = "nameKana" | "scheduleLink";

export type Kokyuhyo = Record<StaffScheduleBaseKey, string>;

export type PublicKokyuhyo = Omit<Kokyuhyo, StaffHiddenKey> & {
  hasScheduleLink: boolean;
};

export type Jugyoin = Record<
  StaffScheduleBaseKey | "bumon" | "bumonKana",
  string
>;

export type PublicJugyoin = Omit<Jugyoin, StaffHiddenKey | "bumonKana"> & {
  hasScheduleLink: boolean;
};

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

export type UpdateMeta = Record<
  "target" | "updatedAt" | "status" | "message",
  string
>;

export interface RdpTarget {
  name: string;
  ipAddress: string;
}

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
  UPDATE_META: {
    sheetName: "UpdateMetaData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
} as const;

// ============================================================
// Spreadsheet Data Mapping
// ============================================================

type SheetDefinition = (typeof SHEETS)[keyof typeof SHEETS];

export type SheetId = SheetDefinition["sheetName"];

type SheetRowMap = {
  [SHEETS.STORE.sheetName]: PublicShop;
  [SHEETS.KOKYUHYO.sheetName]: PublicKokyuhyo;
  [SHEETS.JUGYOIN.sheetName]: PublicJugyoin;
  [SHEETS.KOKYUHYO_TANTOU.sheetName]: Tantou;
  [SHEETS.OPERATION.sheetName]: OperationMaster;
  [SHEETS.IRREGULAR.sheetName]: IrregularMaster;
  [SHEETS.RDP.sheetName]: RdpTarget;
  [SHEETS.UPDATE_META.sheetName]: UpdateMeta;
};

type SheetRow<TSheetId extends SheetId> = SheetRowMap[TSheetId];

export type SheetData<TSheetId extends SheetId> = SheetRow<TSheetId>[];

// ============================================================
// Renderer Sheet & Master Data State
// ============================================================

export interface SheetDataResponse<TSheetId extends SheetId> {
  sheetId: TSheetId;
  data: SheetData<TSheetId>;
}

export type SheetDataState = {
  [TSheetId in SheetId]: SheetDataResponse<TSheetId> | null;
};

export interface SpreadsheetDailyUpdateStatus {
  isUpdatedToday: boolean;
  updatedAt: string | null;
  kokyuhyoUpdatedAt: string | null;
  jugyoinUpdatedAt: string | null;
  status: string | null;
  message: string | null;
  warningMessage: string | null;
}

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
