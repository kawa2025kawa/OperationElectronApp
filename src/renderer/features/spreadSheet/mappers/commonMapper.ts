export const EMPTY_VALUE = "-";

export function sanitizeHeader(text: string): string {
  return text ? text.replace(/[\r\n\t\s]+/g, "").trim() : "";
}

/**
 * 複数のキー候補から最初に存在する有効な文字列値を取得する
 */
export function getValue(
  obj: Record<string, string> | undefined,
  keys: readonly string[],
  defaultValue: string = EMPTY_VALUE,
): string {
  if (!obj) return defaultValue;
  for (const key of keys) {
    const val = obj[key]?.trim();
    if (val && val !== EMPTY_VALUE) {
      return val;
    }
  }
  return defaultValue;
}

export function parseRawToFlatObjects(
  rawRows: string[][],
  keyMap?: Record<string, string>,
): Record<string, string>[] {
  if (rawRows.length <= 1) return [];
  const headers = rawRows[0] ?? [];
  const validKeys = headers.map((h) => {
    const sanitized = sanitizeHeader(h);
    return sanitized ? (keyMap?.[sanitized] ?? sanitized) : "";
  });

  return rawRows.slice(1).reduce<Record<string, string>[]>((acc, row, idx) => {
    if (row.every((cell) => !cell || !cell.trim())) return acc;
    const item: Record<string, string> = { _rowIdx: String(idx + 1) };
    validKeys.forEach((key, colIdx) => {
      if (key) {
        item[key] = (row[colIdx] ?? "").trim();
      }
    });
    acc.push(item);
    return acc;
  }, []);
}
