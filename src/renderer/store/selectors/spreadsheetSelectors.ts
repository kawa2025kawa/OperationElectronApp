// src/renderer/store/selectors/spreadsheetSelectors.ts

import type { AppState } from "@renderer/store";
import { SHEETS } from "@shared/types/spreadsheet/spreadsheetTypes";
import type { Tantou } from "@shared/types/spreadsheet/tantou";
import { getValueByPath } from "@shared/utils/getValueByPath";

const EMPTY_MASTERS = Object.freeze([]) as readonly never[];

// 担当表マスタデータをストアから取得して返す。
export const selectTantouMasters = (state: AppState): Tantou[] =>
  (state.sheetData[SHEETS.KOKYUHYO_TANTOU.sheetName]?.data ??
    EMPTY_MASTERS) as unknown as Tantou[];

// オブジェクトの指定キーまたは全文字列プロパティに検索語が含まれるかを判定する。
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

// 指定シートIDのデータを取得し、検索キーワードで絞り込んだ行配列を返すセレクターを生成する。
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

