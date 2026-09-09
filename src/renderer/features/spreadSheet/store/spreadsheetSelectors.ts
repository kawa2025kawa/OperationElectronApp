// src/renderer/features/spreadSheet/store/spreadsheetSelectors.ts

import { getValueByPath } from "@shared/utils/getValueByPath";
import type { AppState } from "@renderer/store";
import type { SheetId } from "@shared/types/spreadsheet";

const EMPTY_ROWS: readonly unknown[] = [];

const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === "object" && val !== null;

const containsTerm = (obj: unknown, term: string): boolean => {
  if (obj == null) return false;

  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    return String(obj).toLowerCase().includes(term);
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => containsTerm(item, term));
  }

  if (isObject(obj)) {
    return Object.values(obj).some((val) => containsTerm(val, term));
  }

  return false;
};

export const selectFilteredSheetRows =
  <T>(
    sheetId: SheetId | null,
    searchKeys: readonly string[] = [],
    skipFilter = false,
  ) =>
  (state: AppState): T[] => {
    if (!sheetId || !state.sheetData[sheetId]) {
      return EMPTY_ROWS as T[];
    }

    const rows = state.sheetData[sheetId]?.data as T[];

    if (!rows || rows.length === 0 || skipFilter) {
      return rows ?? (EMPTY_ROWS as T[]);
    }

    const term = state.searchTerm.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      if (searchKeys.length > 0) {
        const keyMatch = searchKeys.some((key) => {
          const val = getValueByPath(row as Record<string, unknown>, key);
          return val != null && String(val).toLowerCase().includes(term);
        });

        if (keyMatch) {
          return true;
        }
      }

      return containsTerm(row, term);
    });
  };
