// src/shared/types/spreadsheet/spreadsheetTypes.ts

import type { Column } from "@shared/types/table/tableType";
import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";
import type {
  IrregularMaster,
  OperationMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpTarget } from "@shared/types/rdp/rdpTypes";

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

export type SheetRow<TSheetId extends SheetId> = SheetRowMap[TSheetId];

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
