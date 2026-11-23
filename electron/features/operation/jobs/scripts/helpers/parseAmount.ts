// electron/features/operation/jobs/scripts/helpers/parseAmount.ts

import { readParsedCsv } from "./csvUtils";

interface ExcelCellObject {
  result?: unknown;
  richText?: Array<{ text?: unknown }>;
}

/**
- Excelセル値（数式結果・リッチテキスト・プリミティブ値）からトリム済み文字列を抽出する。
 */
export function extractCellText(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    const cell = value as ExcelCellObject;

    if (cell.result != null) {
      return extractCellText(cell.result);
    }

    if (Array.isArray(cell.richText)) {
      return cell.richText
        .map((item) => String(item?.text ?? ""))
        .join("")
        .trim();
    }
  }

  return String(value).trim();
}

export function parseAmount(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = extractCellText(value).replace(/[\s,]/g, "").trim();

  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const num = Number(normalized);

  return Number.isFinite(num) ? num : null;
}

export function parseRealYosanAmount(value: unknown): number | null {
  const amount = parseAmount(value);
  return amount !== null ? amount * 1000 : null;
}

export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

export async function aggregateCsvAmountByStore(
  filePath: string,
  encoding = "Shift_JIS",
  excludedStoreCodes?: ReadonlySet<string>,
) {
  const rows = (await readParsedCsv(filePath, encoding)).slice(1);
  const result = new Map<string, number>();

  for (const row of rows) {
    const storeCode = row[0]?.trim() ?? "";

    if (!storeCode || excludedStoreCodes?.has(storeCode)) {
      continue;
    }

    const amount = parseAmount(row[4]);
    if (amount === null) {
      continue;
    }

    result.set(storeCode, (result.get(storeCode) ?? 0) + amount);
  }

  return result;
}