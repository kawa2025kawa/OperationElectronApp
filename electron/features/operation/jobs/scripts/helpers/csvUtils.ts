// electron/features/operation/jobs/scripts/helpers/csvUtils.ts

import fs from "fs-extra";
import iconv from "iconv-lite";
import path from "node:path";
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

/**
- 1行のCSV文字列をパースして各カラムの配列（各要素トリム済）を返します。
 */
function parseCsvLine(line: string): string[] {
  const { data } = Papa.parse<string[]>(line, {
    delimiter: ",",
    quoteChar: '"',
    escapeChar: '"',
    skipEmptyLines: false,
  });

  const row = data[0] ?? [];
  return row.map((col) => col.trim());
}

/**
- 複数行のCSVテキストを一括でパースします（セル内改行にも対応）。
 */
function parseCsv(csv: string): string[][] {
  const { data } = Papa.parse<string[]>(csv, {
    delimiter: ",",
    quoteChar: '"',
    escapeChar: '"',
    skipEmptyLines: "greedy",
  });

  return data.map((row) => row.map((col) => col.trim()));
}

/**
- 指定エンコーディングのCSVファイルを一括パースして2次元配列で返します。
 */
export async function readParsedCsv(
  filePath: string,
  encoding = "Shift_JIS",
): Promise<string[][]> {
  return parseCsv(await readEncodedText(filePath, encoding));
}

/**
- CSVファイルを読み込んでパース結果を返します。
 */
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