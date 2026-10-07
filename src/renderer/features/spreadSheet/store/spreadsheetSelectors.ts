// src/renderer/features/spreadSheet/store/spreadsheetSelectors.ts

import type { AppState } from "@renderer/store";
import {
  SHEETS,
  type IrregularMaster,
  type OperationMaster,
  type RdpMaster,
  type TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { getValueByPath } from "@shared/utils/getValueByPath";

const EMPTY_OPERATION_MASTERS: OperationMaster[] = [];
const EMPTY_IRREGULAR_MASTERS: IrregularMaster[] = [];
const EMPTY_TODAY_IRREGULAR_MASTERS: TodayIrregularMaster[] = [];
const EMPTY_RDP_MASTERS: RdpMaster[] = [];
const EMPTY_SHOP_MASTERS: Shop[] = [];
const EMPTY_JUGYOIN_MASTERS: Jugyoin[] = [];
const EMPTY_KOKYUHYO_MASTERS: Kokyuhyo[] = [];
const EMPTY_TANTOU_MASTERS: Tantou[] = [];
const EMPTY_SHEET_ROWS: never[] = [];

const EMPTY_SHOP_FILE_PATHS = {
  excelPath: "",
  pdfPath: "",
};

const containsTerm = (value: unknown, term: string): boolean => {
  if (value == null) {
    return false;
  }

  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return String(value).toLowerCase().includes(term);

    case "object":
      return Array.isArray(value)
        ? value.some((item) => containsTerm(item, term))
        : Object.values(value as Record<string, unknown>).some((item) =>
            containsTerm(item, term),
          );

    default:
      return false;
  }
};

export const selectOperationMasters = (state: AppState): OperationMaster[] =>
  (state.sheetData[SHEETS.OPERATION.sheetName]?.data ??
    EMPTY_OPERATION_MASTERS) as OperationMaster[];

export const selectIrregularMasters = (state: AppState): IrregularMaster[] =>
  (state.sheetData[SHEETS.IRREGULAR.sheetName]?.data ??
    EMPTY_IRREGULAR_MASTERS) as IrregularMaster[];

export const selectTodayIrregularMasters = (
  state: AppState,
): TodayIrregularMaster[] =>
  (state.sheetData[SHEETS.TODAY_IRREGULAR.sheetName]?.data ??
    EMPTY_TODAY_IRREGULAR_MASTERS) as TodayIrregularMaster[];

export const selectRdpMasters = (state: AppState): RdpMaster[] =>
  (state.sheetData[SHEETS.RDP.sheetName]?.data ??
    EMPTY_RDP_MASTERS) as RdpMaster[];

export const selectShopMasters = (state: AppState): Shop[] =>
  (state.sheetData[SHEETS.STORE.sheetName]?.data ??
    EMPTY_SHOP_MASTERS) as Shop[];

export const selectJugyoinMasters = (state: AppState): Jugyoin[] =>
  (state.sheetData[SHEETS.JUGYOIN.sheetName]?.data ??
    EMPTY_JUGYOIN_MASTERS) as Jugyoin[];

export const selectKokyuhyoMasters = (state: AppState): Kokyuhyo[] =>
  (state.sheetData[SHEETS.KOKYUHYO.sheetName]?.data ??
    EMPTY_KOKYUHYO_MASTERS) as Kokyuhyo[];

export const selectTantouMasters = (state: AppState): Tantou[] =>
  (state.sheetData[SHEETS.KOKYUHYO_TANTOU.sheetName]?.data ??
    EMPTY_TANTOU_MASTERS) as Tantou[];

export const selectFilteredSheetRows =
  <T>(
    sheetId: keyof AppState["sheetData"] | null,
    searchKeys: readonly string[] = [],
    skipFilter = false,
  ) =>
  (state: AppState): T[] => {
    if (!sheetId) {
      return EMPTY_SHEET_ROWS as T[];
    }

    const sheet = state.sheetData[sheetId];

    if (!sheet) {
      return EMPTY_SHEET_ROWS as T[];
    }

    const rows = sheet.data as T[];

    if (!rows.length || skipFilter) {
      return rows;
    }

    const term = state.searchTerm.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      if (searchKeys.length > 0) {
        const matched = searchKeys.some((key) => {
          const value = getValueByPath(row as Record<string, unknown>, key);

          return value != null && String(value).toLowerCase().includes(term);
        });

        if (matched) {
          return true;
        }
      }

      return containsTerm(row, term);
    });
  };

// 店舗コード正規化関数
function normalizeShopCode(value: unknown): string {
  if (value == null) {
    return "";
  }

  const code = String(value).trim();

  if (!code) {
    return "";
  }

  return /^\d+$/.test(code)
    ? String(Number.parseInt(code, 10))
    : code.toLowerCase();
}

function getFilePath(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const path = value.trim();

  return path && path !== "-" ? path : "";
}

/**
 * 店舗コードに紐づく Excel / PDF パスを取得する Selector
 */
export const selectShopFilePaths = (shopCode: unknown) => (state: AppState) => {
  const rows = selectShopMasters(state);

  if (!rows.length) {
    return EMPTY_SHOP_FILE_PATHS;
  }

  const normalizedCode = normalizeShopCode(shopCode);

  if (!normalizedCode) {
    return EMPTY_SHOP_FILE_PATHS;
  }

  const shop = rows.find(
    (item) => normalizeShopCode(item.shopCode) === normalizedCode,
  );

  if (!shop) {
    return EMPTY_SHOP_FILE_PATHS;
  }

  return {
    excelPath: getFilePath(shop.excelFilePath),
    pdfPath: getFilePath(shop.pdfFilePath),
  };
};
