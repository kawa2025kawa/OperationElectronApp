// electron/features/operation/jobs/scripts/helpers/csvUtils.ts

import path from "node:path";
import fs from "fs-extra";
import iconv from "iconv-lite";
import Papa from "papaparse";
import { readEncodedText } from "./jobRunnerHelper";

export type CsvRow = {
  columns: string[];
  line: string;
};

export type ParsedCsv = {
  header: string;
  rows: CsvRow[];
};

type CsvOptions = {
  encoding?: string;
  lineEnding?: string;
};

interface ExcelCellObject {
  result?: unknown;
  richText?: Array<{ text?: unknown }>;
}

function parseCsvLine(line: string): string[] {
  const { data } = Papa.parse<string[]>(line, {
    delimiter: ",",
    quoteChar: '"',
    escapeChar: '"',
    skipEmptyLines: false,
  });

  return (data[0] ?? []).map((col) => col.trim());
}

export async function readParsedCsv(
  filePath: string,
  encoding = "Shift_JIS",
): Promise<string[][]> {
  const csv = await readEncodedText(filePath, encoding);
  const { data } = Papa.parse<string[]>(csv, {
    delimiter: ",",
    quoteChar: '"',
    escapeChar: '"',
    skipEmptyLines: "greedy",
  });

  return data.map((row) => row.map((col) => col.trim()));
}

export async function readCsv(
  filePath: string,
  encoding = "Shift_JIS",
): Promise<ParsedCsv> {
  const content = await readEncodedText(filePath, encoding);
  const [header = "", ...lines] = content.split(/\r?\n/);

  return {
    header,
    rows: lines
      .filter((line) => line.trim() !== "")
      .map((line) => ({
        line,
        columns: parseCsvLine(line),
      })),
  };
}

export function groupCsvRowsBy(
  rows: CsvRow[],
  getKey: (row: CsvRow) => string,
): Map<string, CsvRow[]> {
  const groups = new Map<string, CsvRow[]>();

  for (const row of rows) {
    const key = getKey(row);
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  return groups;
}

export async function writeCsvRows(
  filePath: string,
  header: string,
  rows: CsvRow[],
  options: CsvOptions = {},
): Promise<void> {
  const { encoding = "Shift_JIS", lineEnding = "\r\n" } = options;
  const content =
    [header, ...rows.map((row) => row.line)].join(lineEnding) + lineEnding;

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, iconv.encode(content, encoding));
}

export function extractCellText(value: unknown): string {
  if (value == null) return "";

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
  if (value == null) return null;
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
    if (!storeCode || excludedStoreCodes?.has(storeCode)) continue;

    const amount = parseAmount(row[4]);
    if (amount === null) continue;

    result.set(storeCode, (result.get(storeCode) ?? 0) + amount);
  }

  return result;
}
