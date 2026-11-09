// src/shared/types/spreadsheet/spreadsheetTypes.ts

import type { Column } from "@shared/types/table/tableType";
import type {
  IrregularMaster,
  OperationMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpTarget } from "@shared/types/rdp/rdpTypes";

/* =========================
 * Sheet Entity Types & Field Labels
 * ========================= */

const PRINTER_TYPES = ["B", "K", "O"] as const;
type PrinterType = (typeof PRINTER_TYPES)[number];
type PrinterSuffix = PrinterType;

const TR_INDICES = [1, 2, 3, 4] as const;
type TrIndex = (typeof TR_INDICES)[number];

const BASE_SHOP_FIELD_LABELS = {
  shopCode: "店舗コード",
  shopName: "店舗名",
  shopKana: "店舗カナ",
  openTime: "開店時間",
  closeTime: "閉店時間",
  centerName: "センタ",
  areaName: "エリア",
  phoneNumber: "電話番号",
  postalCode: "郵便番号",
  address: "住所",
  mobileSales: "移動販売",

  storeManagerName: "店長",
  assistantManagerName1: "副店長1",
  assistantManagerName2: "副店長2",
  areaManagerName: "マネージャ",

  excelFilePath: "Excelパス",
  pdfFilePath: "PDFパス",

  deviceCount: "端末台数",
  comment: "コメント",
  hubImageUrl: "HUB",
  outletImageUrl: "コンセント",
} as const;

const PRINTER_FIELD_LABELS = {
  ...Object.fromEntries(
    PRINTER_TYPES.flatMap((t) => [
      [`printerModel${t}`, `プリンター(${t}) 機種名`],
      [`printerSerialNumber${t}`, `プリンター(${t}) シリアル`],
      [`printerPhone${t}`, `プリンター(${t}) 連絡先`],
      [`printerHolidayPhone${t}`, `プリンター(${t}) 休日連絡先`],
      [`printerContractId${t}`, `プリンター(${t}) 土日祝ID`],
    ]),
  ),
} as {
  [K in PrinterType as
    | `printerModel${K}`
    | `printerSerialNumber${K}`
    | `printerPhone${K}`
    | `printerHolidayPhone${K}`
    | `printerContractId${K}`]: string;
};

const TR_FIELD_LABELS = {
  ...Object.fromEntries(
    TR_INDICES.flatMap((i) => [
      [`tr${i}Name`, `TR${i} 端末名`],
      [`tr${i}Ip`, `TR${i} IP`],
      [`tr${i}Model`, `TR${i} 型番`],
      [`tr${i}LogicalName`, `TR${i} 論理`],
      [`tr${i}PhysicalName`, `TR${i} 物理`],
      [`tr${i}ImageUrl`, `TR${i} 画像`],
    ]),
  ),
} as {
  [K in TrIndex as
    | `tr${K}Name`
    | `tr${K}Ip`
    | `tr${K}Model`
    | `tr${K}LogicalName`
    | `tr${K}PhysicalName`
    | `tr${K}ImageUrl`]: string;
};

export const SHOP_FIELD_LABELS = {
  ...BASE_SHOP_FIELD_LABELS,
  ...PRINTER_FIELD_LABELS,
  ...TR_FIELD_LABELS,
} as const;

type ShopPrinterKeys =
  | `printerModel${PrinterSuffix}`
  | `printerSerialNumber${PrinterSuffix}`
  | `printerPhone${PrinterSuffix}`
  | `printerHolidayPhone${PrinterSuffix}`
  | `printerContractId${PrinterSuffix}`;

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

/* =========================
 * Spreadsheet ID
 * ========================= */

const SPREADSHEET_ID = {
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
  [SHEETS.RDP.sheetName]: RdpTarget;
};

type SheetRow<TSheetId extends SheetId> = SheetRowMap[TSheetId];

export type SheetData<TSheetId extends SheetId> = SheetRow<TSheetId>[];

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

/* =========================
 * Schedule Modal Labels
 * ========================= */

export const SCHEDULE_MODAL_LABELS = {
  PROFILE: {
    POSITION: "役職",
    EMAIL: "Email",
    EXTENSION: "内線",
    MOBILE_SHORT_JUGYOIN: "PHS",
    MOBILE_SHORT_KOKYUHYO: "短縮",
    MOBILE: "携帯",
    SCHEDULE_LINK: "Schedulelink",
  },
  TABLE_HEADER: {
    CATEGORY: "区分",
    LOCATION: "場所",
    DETAIL: "詳細",
    AM: "AM",
    PM: "PM",
  },
} as const;

/* =========================
 * Spreadsheet Columns Definitions
 * ========================= */

export interface SpreadsheetDateLabels {
  today: string;
  tomorrow: string;
}

export const SHOP_COLUMNS: readonly Column<Shop>[] = [
  { key: "shopCode", label: "店舗コード", width: "10%" },
  { key: "shopName", label: "店舗名", width: "20%" },
  { key: "phoneNumber", label: "電話番号", width: "15%" },
  { key: "postalCode", label: "郵便番号", width: "15%" },
  { key: "address", label: "住所", width: "40%" },
];

export function getKokyuhyoColumns(
  dateLabels: SpreadsheetDateLabels,
): readonly Column<Kokyuhyo>[] {
  return [
    { key: "name", label: "氏名", width: "20%" },
    {
      key: "todayAmStatus",
      label: "区分",
      width: "8%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "todayAmDetail",
      label: "午前",
      width: "12%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "todayPmStatus",
      label: "区分",
      width: "8%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "todayPmDetail",
      label: "午後",
      width: "12%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "tomorrowAmStatus",
      label: "区分",
      width: "8%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
    {
      key: "tomorrowAmDetail",
      label: "午前",
      width: "12%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
    {
      key: "tomorrowPmStatus",
      label: "区分",
      width: "8%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
    {
      key: "tomorrowPmDetail",
      label: "午後",
      width: "12%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
  ];
}

export function getJugyoinColumns(
  dateLabels: SpreadsheetDateLabels,
): readonly Column<Jugyoin>[] {
  return [
    { key: "bumon", label: "部門", width: "15%" },
    { key: "name", label: "氏名", width: "15%" },
    {
      key: "todayAmStatus",
      label: "区分",
      width: "7%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "todayAmDetail",
      label: "午前",
      width: "10.5%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "todayPmStatus",
      label: "区分",
      width: "7%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "todayPmDetail",
      label: "午後",
      width: "10.5%",
      headerGroup: { groupKey: "today", label: dateLabels.today },
    },
    {
      key: "tomorrowAmStatus",
      label: "区分",
      width: "7%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
    {
      key: "tomorrowAmDetail",
      label: "午前",
      width: "10.5%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
    {
      key: "tomorrowPmStatus",
      label: "区分",
      width: "7%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
    {
      key: "tomorrowPmDetail",
      label: "午後",
      width: "10.5%",
      headerGroup: { groupKey: "tomorrow", label: dateLabels.tomorrow },
    },
  ];
}

/* =========================
 * Common Fallback Constants
 * ========================= */

export const EMPTY_VALUE_FALLBACK = "-" as const;
