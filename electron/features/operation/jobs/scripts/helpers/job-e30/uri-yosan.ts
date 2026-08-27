import fs from "fs-extra";
import { parseAmount } from "../shared/parseAmount"; // sharedから参照[cite: 1]
import { parseCsv } from "../shared/parseCsvLine";

type UriYosanMap = Map<string, number>;

interface UriYosanResult {
  resultMap: UriYosanMap;
  totalRowsProcessed: number;
}

function normalizeStoreCode(value: string): string {
  const codePart = value.split(":")[0]?.trim() ?? value;
  const numericOnly = codePart.replace(/[^0-9]/g, "");
  const num = Number.parseInt(numericOnly, 10);
  if (Number.isNaN(num)) {
    return value.trim().slice(0, 3);
  }
  return String(num).padStart(3, "0");
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
    throw new Error("開始店舗コード '002' が見つかりませんでした");
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
