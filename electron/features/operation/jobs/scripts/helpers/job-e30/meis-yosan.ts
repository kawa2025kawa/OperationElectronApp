import fs from "fs-extra";
import { parseAmount } from "../shared/parseAmount"; // sharedから参照[cite: 1]
import { parseCsv } from "../shared/parseCsvLine";

type MeisYosanMap = Map<string, number>;

interface MeisYosanStatistics {
  rowCount: number;
  validRowCount: number;
  ignoredRowCount: number;
  invalidAmountCount: number;
}

interface MeisYosanResult {
  resultMap: MeisYosanMap;
  statistics: MeisYosanStatistics;
}

function normalizeStoreCode(value: string): string {
  const numericOnly = value.replace(/[^0-9]/g, "");
  const num = Number.parseInt(numericOnly, 10);
  if (Number.isNaN(num)) {
    return value.trim().slice(0, 3);
  }
  return String(num).padStart(3, "0");
}

export async function parseMeisYosan(
  filePath: string,
): Promise<MeisYosanResult> {
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

  for (const row of rows.slice(1)) {
    statistics.rowCount++;
    const rawStoreCode = row[0]?.trim() ?? "";
    if (!rawStoreCode) {
      statistics.ignoredRowCount++;
      continue;
    }

    const storeCode = normalizeStoreCode(rawStoreCode);
    const amount = parseAmount(row[4]);
    if (amount === null) {
      statistics.invalidAmountCount++;
      continue;
    }

    statistics.validRowCount++;
    resultMap.set(storeCode, (resultMap.get(storeCode) ?? 0) + amount);
  }

  return {
    resultMap,
    statistics,
  };
}
