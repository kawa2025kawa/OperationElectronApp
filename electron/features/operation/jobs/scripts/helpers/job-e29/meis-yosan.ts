//electron\features\operation\jobs\scripts\helpers\job-e29\meis-yosan.ts

import fs from "fs-extra";
import { parseAmount } from "../shared/parseAmount"; // sharedへ変更
import { parseCsv } from "../shared/parseCsvLine"; // sharedへ変更[cite: 1]

type MeisYosanMap = Map<string, number>;

const FORBIDDEN_KEYS = new Set([
  "11",
  "24",
  "43",
  "57",
  "59",
  "88",
  "94",
  "98",
]);

interface MeisYosanStatistics {
  rowCount: number;
  validRowCount: number;
  ignoredRowCount: number;
  forbiddenRowCount: number;
  invalidAmountCount: number;
}
interface MeisYosanResult {
  resultMap: MeisYosanMap;
  statistics: MeisYosanStatistics;
}

export async function parseMeisYosan(
  filePath: string,
): Promise<MeisYosanResult> {
  const csv = await fs.readFile(filePath, "utf8");

  const rows = parseCsv(csv);

  const resultMap: MeisYosanMap = new Map();

  const statistics: MeisYosanStatistics = {
    rowCount: 0,
    validRowCount: 0,
    ignoredRowCount: 0,
    forbiddenRowCount: 0,
    invalidAmountCount: 0,
  };

  for (const row of rows.slice(1)) {
    statistics.rowCount++;

    const storeCode = row[0]?.trim() ?? "";

    if (!storeCode) {
      statistics.ignoredRowCount++;
      continue;
    }

    if (FORBIDDEN_KEYS.has(storeCode)) {
      statistics.forbiddenRowCount++;
      continue;
    }

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
