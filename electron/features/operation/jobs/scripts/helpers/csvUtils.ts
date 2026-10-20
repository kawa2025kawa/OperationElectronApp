// electron/features/operation/jobs/scripts/helpers/csvUtils.ts

import fs from "fs-extra";
import iconv from "iconv-lite";
import path from "node:path";

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
 * 1行のCSV文字列をパースして各カラムの配列（各要素トリム済）を返します。
 * ダブルクォーテーションのクォート処理および "" のエスケープに対応します。
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

/**
 * 複数行のCSVテキストを一括でパースします。
 */
export function parseCsv(csv: string): string[][] {
  return csv
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map(parseCsvLine);
}

/**
 * CSVファイルを読み込んでパース結果を返します。
 */
export async function readCsv(
  filePath: string,
  encoding = "Shift_JIS",
): Promise<ParsedCsv> {
  const content = iconv.decode(await fs.readFile(filePath), encoding);
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

export function filterCsvRows(
  rows: CsvRow[],
  predicate: (row: CsvRow) => boolean,
): CsvRow[] {
  return rows.filter(predicate);
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
