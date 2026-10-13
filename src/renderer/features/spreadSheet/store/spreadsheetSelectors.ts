// src/renderer/features/spreadSheet/store/spreadsheetSelectors.ts

import type { AppState } from "@renderer/store";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Shop } from "@shared/types/spreadsheet/shop";
import type { Jugyoin } from "@shared/types/spreadsheet/jugyoin";
import type { Kokyuhyo } from "@shared/types/spreadsheet/kokyuhyo";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { getValueByPath } from "@shared/utils/getValueByPath";

/* =========================
 * Constants & Empty Fallbacks
 * ========================= */

const EMPTY_MASTERS = Object.freeze([]) as readonly never[];

/* =========================
 * Base Sheet Selectors
 * ========================= */

// Operation、Irregular、TodayIrregularはバックエンド側で扱う。

export const selectShopMasters = (state: AppState): Shop[] =>
  (state.sheetData[SHEETS.STORE.sheetName]?.data ??
    EMPTY_MASTERS) as unknown as Shop[];

export const selectJugyoinMasters = (state: AppState): Jugyoin[] =>
  (state.sheetData[SHEETS.JUGYOIN.sheetName]?.data ??
    EMPTY_MASTERS) as unknown as Jugyoin[];

export const selectKokyuhyoMasters = (state: AppState): Kokyuhyo[] =>
  (state.sheetData[SHEETS.KOKYUHYO.sheetName]?.data ??
    EMPTY_MASTERS) as unknown as Kokyuhyo[];

export const selectTantouMasters = (state: AppState): Tantou[] =>
  (state.sheetData[SHEETS.KOKYUHYO_TANTOU.sheetName]?.data ??
    EMPTY_MASTERS) as unknown as Tantou[];

/* =========================
 * Search Filtering Helper
 * ========================= */

function matchesSearchTerm(
  row: Record<string, unknown>,
  term: string,
  searchKeys: readonly string[],
): boolean {
  if (!term) return true;

  if (searchKeys.length > 0) {
    for (const key of searchKeys) {
      const val = getValueByPath(row, key);

      if (val != null && String(val).toLowerCase().includes(term)) {
        return true;
      }
    }

    return false;
  }

  for (const value of Object.values(row)) {
    if (value != null && typeof value !== "object") {
      if (String(value).toLowerCase().includes(term)) {
        return true;
      }
    }
  }

  return false;
}

/* =========================
 * Filtered Sheet Rows Selector
 * ========================= */

export const selectFilteredSheetRows =
  <T>(
    sheetId: keyof AppState["sheetData"] | null,
    searchKeys: readonly string[] = [],
    skipFilter = false,
  ) =>
  (state: AppState): T[] => {
    if (!sheetId) return EMPTY_MASTERS as unknown as T[];

    const sheet = state.sheetData[sheetId];

    if (!sheet || !sheet.data) {
      return EMPTY_MASTERS as unknown as T[];
    }

    const rows = sheet.data as T[];

    if (rows.length === 0 || skipFilter) return rows;

    const term = state.searchTerm.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((row) =>
      matchesSearchTerm(row as Record<string, unknown>, term, searchKeys),
    );
  };
