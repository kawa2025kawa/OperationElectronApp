// src/renderer/features/table/utils/tableSearchUtils.ts

import type { Row, RowData, TableFeatures } from "@tanstack/react-table";

// オブジェクトからドット区切りのパスで値を取得する。
function getValueByPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, value);
}

// 値に検索文字列が含まれるか判定する。
function includesSearchTerm(value: unknown, term: string): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  return String(value).toLowerCase().includes(term);
}

export function createRegistryGlobalFilter<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(searchKeys: readonly string[] = [], skipFilter = false) {
  // 同一行・同一検索語の検索結果を保持する。
  const resultCache = new WeakMap<
    Row<TFeatures, TData>,
    {
      term: string;
      result: boolean;
    }
  >();

  return (
    row: Row<TFeatures, TData>,
    _columnId: string,
    filterValue: unknown,
  ): boolean => {
    if (skipFilter) return true;

    const term = String(filterValue ?? "")
      .trim()
      .toLowerCase();

    if (!term) return true;

    const cached = resultCache.get(row);

    if (cached?.term === term) {
      return cached.result;
    }

    const original = row.original;
    let result: boolean;

    if (searchKeys.length > 0) {
      result = searchKeys.some((key) =>
        includesSearchTerm(getValueByPath(original, key), term),
      );
    } else if (
      original === null ||
      original === undefined ||
      typeof original !== "object"
    ) {
      result = includesSearchTerm(original, term);
    } else {
      result = Object.values(original as Record<string, unknown>).some(
        (value) =>
          value === null || typeof value !== "object"
            ? includesSearchTerm(value, term)
            : false,
      );
    }

    resultCache.set(row, {
      term,
      result,
    });

    return result;
  };
}
