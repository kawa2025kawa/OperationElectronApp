import Workbook from "exceljs";

import { parseRealYosanAmount } from "../shared/parseAmount";
import { extractStoreCode, isTotalRow } from "./store";

const TARGET_SHEET_NAME = "店舗毎（税抜き）";

type RealYosanMap = Map<string, number>;

interface RealYosanStatistics {
  storeHeaderCount: number;
  totalRowCount: number;
  validTotalCount: number;
  invalidAmountCount: number;
  ignoredRowCount: number;
}

interface RealYosanResult {
  resultMap: RealYosanMap;
  statistics: RealYosanStatistics;
  storeTotal: number;
}

export async function parseRealYosan(
  filePath: string,
): Promise<RealYosanResult> {
  const workbook = new Workbook.Workbook();

  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(TARGET_SHEET_NAME);

  if (!worksheet) {
    throw new Error(`シート '${TARGET_SHEET_NAME}' が見つかりません。`);
  }

  const resultMap: RealYosanMap = new Map();

  const statistics: RealYosanStatistics = {
    storeHeaderCount: 0,
    totalRowCount: 0,
    validTotalCount: 0,
    invalidAmountCount: 0,
    ignoredRowCount: 0,
  };

  let currentStoreCode: string | null = null;

  worksheet.eachRow((row) => {
    const columnB = row.getCell(2).value;
    const columnU = row.getCell(21).value;

    const storeCode = extractStoreCode(columnB);

    if (storeCode !== null) {
      currentStoreCode = storeCode;
      statistics.storeHeaderCount++;
      return;
    }

    if (!isTotalRow(columnB)) {
      statistics.ignoredRowCount++;
      return;
    }

    statistics.totalRowCount++;

    if (currentStoreCode === null) {
      statistics.invalidAmountCount++;
      return;
    }

    const amount = parseRealYosanAmount(columnU);

    if (amount === null) {
      statistics.invalidAmountCount++;
      return;
    }

    statistics.validTotalCount++;

    resultMap.set(currentStoreCode, amount);
  });

  const storeTotal = [...resultMap.values()].reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return {
    resultMap,
    statistics,
    storeTotal,
  };
}
