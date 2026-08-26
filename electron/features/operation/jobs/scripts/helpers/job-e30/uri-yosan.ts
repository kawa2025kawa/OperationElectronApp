// electron/features/operation/jobs/scripts/helpers/job-e30/uri-yosan.ts

import fs from "fs-extra";

export type UriYosanMap = Map<string, number>;

export interface UriYosanResult {
  resultMap: UriYosanMap;
  totalRowsProcessed: number;
}

/**
 * 店舗コードを 3桁形式（例: "002:002東町店" -> "002", "2" -> "002"）に正規化する
 */
function normalizeStoreCode(value: string): string {
  // コロンがあれば前の部分を取り出す
  const codePart = value.split(":")[0]?.trim() ?? value;
  const numericOnly = codePart.replace(/[^0-9]/g, "");
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

export async function parseUriYosan(filePath: string): Promise<UriYosanResult> {
  const buffer = await fs.readFile(filePath);
  const decoder = new TextDecoder("shift-jis");
  const csv = decoder.decode(buffer);

  const rows = parseCsv(csv);

  let startIndex = -1;
  let endIndex = -1;

  for (let index = 0; index < rows.length; index++) {
    const col0 = rows[index]?.[0]?.trim() ?? "";

    if (startIndex === -1 && col0.includes("002")) {
      startIndex = index;
    }

    if (startIndex !== -1 && col0.includes("700")) {
      endIndex = index;
      break;
    }
  }

  if (startIndex === -1) {
    throw new Error(
      "売上予算確認CSV内に開始条件（A列に '002' を含む行）が見つかりませんでした",
    );
  }

  const validRows =
    endIndex !== -1 ? rows.slice(startIndex, endIndex) : rows.slice(startIndex);

  const resultMap: UriYosanMap = new Map();

  for (const row of validRows) {
    const rawLabel = row[0]?.trim() ?? "";
    const amount = parseAmount(row[1]);

    if (!rawLabel || amount === null) {
      continue;
    }

    const storeCode = normalizeStoreCode(rawLabel);
    resultMap.set(storeCode, amount);
  }

  return {
    resultMap,
    totalRowsProcessed: validRows.length,
  };
}
