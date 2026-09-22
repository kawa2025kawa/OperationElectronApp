// src/renderer/features/spreadSheet/services/mappers/utils/parseUtils.ts

export const EMPTY_VALUE = "-";

export function sanitizeHeader(text: string): string {
  return text ? text.replace(/[\r\n\t\s]+/g, "").trim() : "";
}

export function getValue<T extends string | null | undefined = string>(
  obj: Record<string, string> | undefined,
  keys: readonly string[],
  defaultValue: T = EMPTY_VALUE as T,
): string | T {
  if (!obj) return defaultValue;
  for (const key of keys) {
    const value = obj[key]?.trim();
    if (value && value !== EMPTY_VALUE) return value;
  }
  return defaultValue;
}

export function parseBooleanField(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (!val) return false;

  const str = String(val).trim().toLowerCase();
  if (
    str === "" ||
    str === EMPTY_VALUE ||
    str === "false" ||
    str === "0" ||
    str === "null" ||
    str === "undefined"
  ) {
    return false;
  }

  return true;
}

export function parseRawToFlatObjects(
  rawRows: string[][],
): Record<string, string>[] {
  if (rawRows.length <= 1) return [];

  const headers = (rawRows[0] ?? []).map(sanitizeHeader);
  const result: Record<string, string>[] = [];

  for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];
    if (!row?.some((cell) => cell?.trim())) continue;

    const item: Record<string, string> = { _rowIdx: String(rowIndex) };
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const key = headers[colIndex];
      if (key) item[key] = (row[colIndex] ?? "").trim();
    }
    result.push(item);
  }
  return result;
}

export function parseGenericSheet<T extends Record<string, string>>(
  rawRows: string[][],
  prefix: string,
  fieldKeys: readonly string[],
): T[] {
  return parseRawToFlatObjects(rawRows).map((flat, idx) => {
    const item: Record<string, string> = {
      id: `${prefix}_row_${flat._rowIdx ?? idx + 1}`,
    };
    for (const key of fieldKeys) {
      if (key === "id") continue;
      item[key] = getValue(flat, [key]);
    }
    return item as T;
  });
}
