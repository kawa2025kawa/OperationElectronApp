import { getValueByPath } from "@shared/utils/getValueByPath";
import type { AppState } from "@renderer/store";
import type { SheetId } from "@shared/types/spreadsheet/sheetTypes";

const EMPTY_ROWS: readonly unknown[] = [];

/**
 * 🎯 オブジェクト内の全フィールドを再帰的に検索するフォールバック処理
 */
const containsTerm = (obj: unknown, term: string): boolean => {
  if (obj == null) return false;

  const type = typeof obj;

  if (type === "string" || type === "number" || type === "boolean") {
    return String(obj).toLowerCase().includes(term);
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => containsTerm(item, term));
  }

  if (type === "object") {
    return Object.values(obj as Record<string, unknown>).some((val) =>
      containsTerm(val, term),
    );
  }

  return false;
};

/**
 * 🎯 表示中のシートデータを `searchTerm` に基づいて高速にフィルタリングするセレクター
 */
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

    const rows = (state.sheetData[sheetId]?.data ?? []) as T[];

    if (rows.length === 0 || skipFilter) {
      return rows;
    }

    const term = state.searchTerm.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      // 1. searchKeys が指定されている場合は優先的に該当プロパティのみ高速判定
      if (searchKeys.length > 0) {
        const keyMatch = searchKeys.some((key) => {
          const val = getValueByPath(row as Record<string, unknown>, key);
          return val != null && String(val).toLowerCase().includes(term);
        });

        if (keyMatch) {
          return true;
        }
      }

      // 2. 指定キーでヒットしない場合はオブジェクト全体を走査
      return containsTerm(row, term);
    });
  };
