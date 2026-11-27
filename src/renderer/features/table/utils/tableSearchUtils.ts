// src/renderer/features/table/utils/tableSearchUtils.ts

import type { Row, RowData, TableFeatures } from "@tanstack/react-table";
import { getRawValueByPath } from "@renderer/utils/rendererUtils";

const EXCLUDED_GLOBAL_SEARCH_KEYS = new Set<string>(["status"]);

// 値に検索文字列が含まれるか判定する。
function includesSearchTerm(value: unknown, term: string): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  return String(value).toLowerCase().includes(term);
}

// 行の検索対象値のいずれかに単一キーワードが含まれるか判定する。
function matchesSingleTerm<TData>(
  original: TData,
  searchKeys: readonly string[],
  term: string,
): boolean {
  if (searchKeys.length > 0) {
    return searchKeys.some((key) =>
      includesSearchTerm(getRawValueByPath(original, key), term),
    );
  }

  if (
    original === null ||
    original === undefined ||
    typeof original !== "object"
  ) {
    return includesSearchTerm(original, term);
  }

  return Object.entries(original as Record<string, unknown>).some(
    ([key, value]) =>
      !EXCLUDED_GLOBAL_SEARCH_KEYS.has(key) &&
      (value === null || typeof value !== "object")
        ? includesSearchTerm(value, term)
        : false,
  );
}

export function createRegistryGlobalFilter<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(searchKeys: readonly string[] = [], skipFilter = false) {
  // 同一行・同一検索語の検索結果を保持する。
  const resultCache = new WeakMap<
    Row<TFeatures, TData>,
    {
      normalizedQuery: string;
      result: boolean;
    }
  >();

  return (
    row: Row<TFeatures, TData>,
    _columnId: string,
    filterValue: unknown,
  ): boolean => {
    if (skipFilter) return true;

    const terms = String(filterValue ?? "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) return true;

    const normalizedQuery = terms.join(" ");
    const cached = resultCache.get(row);

    if (cached?.normalizedQuery === normalizedQuery) {
      return cached.result;
    }

    const original = row.original;
    const result = terms.every((term) =>
      matchesSingleTerm(original, searchKeys, term),
    );

    resultCache.set(row, {
      normalizedQuery,
      result,
    });

    return result;
  };
}