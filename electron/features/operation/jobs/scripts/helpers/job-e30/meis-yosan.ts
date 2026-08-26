// electron/features/operation/jobs/scripts/helpers/job-e30/meis-yosan.ts

import fs from "fs-extra";

export type MeisYosanMap = Map<string, number>;

export interface MeisYosanStatistics {
  rowCount: number;
  validRowCount: number;
  ignoredRowCount: number;
  invalidAmountCount: number;
}

export interface MeisYosanResult {
  resultMap: MeisYosanMap;
  statistics: MeisYosanStatistics;
}

/* ============================================================
 * Helper Functions (E30 独立処理)
 * ============================================================ */

/**
 * 店舗コードを 3桁のゼロ埋め文字列（例: "2" -> "002", "002:東町店" -> "002"）に正規化する
 */
function normalizeStoreCode(value: string): string {
  const numericOnly = value.replace(/[^0-9]/g, "");
  const num = Number.parseInt(numericOnly, 10);
  if (Number.isNaN(num)) {
    return value.trim().slice(0, 3);
  }
  return String(num).padStart(3, "0");
}

function parseCsvLine(line: string): string[] {
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

function parseCsv(csv: string): string[][] {
  return csv
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map(parseCsvLine);
}

function parseAmount(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/,/g, "").trim();
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? null : num;
}

/* ============================================================
 * Main Function
 * ============================================================ */

/**
 * MEIS0120* ファイルを解析し、店舗コード（3桁正規化）ごとに金額（5列目）を加算した Map を返す
 */
export async function parseMeisYosan(
  filePath: string,
): Promise<MeisYosanResult> {
  // Shift_JIS (CP932) デコード
  const buffer = await fs.readFile(filePath);
  const decoder = new TextDecoder("shift-jis");
  const csv = decoder.decode(buffer);

  const rows = parseCsv(csv);

  const resultMap: MeisYosanMap = new Map();

  const statistics: MeisYosanStatistics = {
    rowCount: 0,
    validRowCount: 0,
    ignoredRowCount: 0,
    invalidAmountCount: 0,
  };

  // 1行目（ヘッダー）をスキップ
  for (const row of rows.slice(1)) {
    statistics.rowCount++;

    const rawStoreCode = row[0]?.trim() ?? "";

    if (!rawStoreCode) {
      statistics.ignoredRowCount++;
      continue;
    }

    // 店舗コードを 3桁形式（例: "002"）に正規化
    const storeCode = normalizeStoreCode(rawStoreCode);

    const amount = parseAmount(row[4]); // 5列目（インデックス4）の金額

    if (amount === null) {
      statistics.invalidAmountCount++;
      continue;
    }

    statistics.validRowCount++;

    // 店舗ごとに金額を加算（Sum集計）
    resultMap.set(storeCode, (resultMap.get(storeCode) ?? 0) + amount);
  }

  return {
    resultMap,
    statistics,
  };
}
