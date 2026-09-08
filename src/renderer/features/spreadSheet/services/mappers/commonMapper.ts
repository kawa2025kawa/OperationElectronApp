// src/renderer/features/spreadSheet/services/mappers/commonMapper.ts

export const EMPTY_VALUE = "-";

/**
 * ヘッダー名を正規化
 */
export function sanitizeHeader(text: string): string {
  return text ? text.replace(/[\r\n\t\s]+/g, "").trim() : "";
}

/**
 * 値取得
 */
export function getValue<T extends string | undefined = string>(
  obj: Record<string, string> | undefined,
  keys: readonly string[],
  defaultValue?: T,
): string | T {
  if (!obj) return defaultValue as T;

  for (const key of keys) {
    const value = obj[key]?.trim();

    if (value && value !== EMPTY_VALUE) {
      return value;
    }
  }

  return defaultValue as T;
}

/**
 * シートデータをフラットオブジェクトへ変換
 *
 * 1行目：ヘッダー
 * 2行目以降：データ
 *
 * ※ GAS側ヘッダーが英字のため keyMap は不要
 */
export function parseRawToFlatObjects(
  rawRows: string[][],
): Record<string, string>[] {
  if (rawRows.length <= 1) {
    return [];
  }

  const headers = (rawRows[0] ?? []).map(sanitizeHeader);

  const result: Record<string, string>[] = [];

  for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];

    if (!row?.some((cell) => cell?.trim())) {
      continue;
    }

    const item: Record<string, string> = {
      _rowIdx: String(rowIndex),
    };

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const key = headers[colIndex];

      if (!key) {
        continue;
      }

      item[key] = (row[colIndex] ?? "").trim();
    }

    result.push(item);
  }

  return result;
}
