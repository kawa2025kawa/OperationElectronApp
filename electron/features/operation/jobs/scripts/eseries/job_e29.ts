// electron/features/operation/jobs/scripts/eseries/job_e29.ts

import path from "node:path";
import * as ExcelJS from "exceljs";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  findFilesByKeywords,
  resolveInputPaths,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import {
  aggregateCsvAmountByStore,
  extractCellText,
  formatSignedYen,
  formatYen,
  normalizeStoreCode,
  parseRealYosanAmount,
} from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import {
  formatAlignedColumns,
  formatStoreDisplayLabel,
} from "@electron/features/operation/jobs/scripts/helpers/logFormatHelper";

const CONFIG = {
  realYosanKeyword: "リアル予算",
  realYosanExtension: ".xlsx",
  meis0120Keyword: "MEIS0120",
  meis0120Extension: ".csv",
  targetSheetName: "店舗毎（税抜き）",
  csvEncoding: "Shift_JIS",
  forbiddenKeys: new Set(["11", "24", "43", "57", "59", "88", "94", "98"]),
  storeCodeRegex: /^(\d{3})\s*[:：]/,
  totalRowRegex: /^合[\s\u3000]*計$/,
  existingStoreRegex: /既存/,
  completionMessage: "予算集計完了",
} as const;

type RealYosanEntry = {
  storeCode: string;
  displayLabel: string;
  amount: number;
};

type RealYosanMap = Map<string, RealYosanEntry>;

type StoreComparison = {
  storeCode: string;
  displayLabel: string;
  realAmount: number;
  meisAmount: number;
  diff: number;
};

type JobResultData = {
  realYosanPath: string;
  meis0120Path: string;
  realStoreCount: number;
  meisStoreCount: number;
  matchedCount: number;
  ignoredCount: number;
  totalRealAmount: number;
  totalMeisAmount: number;
  totalDiff: number;
  comparisons: StoreComparison[];
};

/**
- リアル予算（Excel）と MD予算（MEIS0120 CSV）を集計し、店舗別および全体の予算差異を算出・確認する。
 */
export async function runJobE29(
  inputFilePath?: string | string[],
): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const inputPaths = resolveInputPaths(inputFilePath);
    const result = await aggregateBudgets(inputPaths);
    return writeResultLog(logger, result);
  });
}

function assertFileExtension(filePath: string, expectedExt: string): void {
  const actualExt = path.extname(filePath).toLowerCase();
  if (actualExt !== expectedExt.toLowerCase()) {
    throw new Error(
      `拡張子が不正です (${expectedExt} が必要): ${path.basename(filePath)}`,
    );
  }
}

async function aggregateBudgets(inputPaths: string[]): Promise<JobResultData> {
  if (inputPaths.length === 0) {
    throw new Error("入力ファイルが指定されていません");
  }

  const { realYosanPath, meis0120Path } = findFilesByKeywords(
    inputPaths,
    {
      realYosanPath: CONFIG.realYosanKeyword,
      meis0120Path: CONFIG.meis0120Keyword,
    },
    {
      exactMatchCount: true,
    },
  );

  assertFileExtension(realYosanPath, CONFIG.realYosanExtension);
  assertFileExtension(meis0120Path, CONFIG.meis0120Extension);

  const [realYosanMap, meisYosanMap] = await Promise.all([
    parseRealYosan(realYosanPath),
    aggregateCsvAmountByStore(
      meis0120Path,
      CONFIG.csvEncoding,
      CONFIG.forbiddenKeys,
      true,
    ),
  ]);

  let matchedCount = 0;
  let ignoredCount = 0;
  let totalRealAmount = 0;
  let totalMeisAmount = 0;

  const comparisons: StoreComparison[] = [];
  const sortedCodes = [...realYosanMap.keys()].sort(
    (a, b) => Number(a) - Number(b),
  );

  for (const storeCode of sortedCodes) {
    const realEntry = realYosanMap.get(storeCode)!;

    if (!meisYosanMap.has(storeCode)) {
      ignoredCount++;
      continue;
    }

    const meisAmount = meisYosanMap.get(storeCode)!;
    const diff = realEntry.amount - meisAmount;

    matchedCount++;
    totalRealAmount += realEntry.amount;
    totalMeisAmount += meisAmount;

    comparisons.push({
      storeCode,
      displayLabel: realEntry.displayLabel,
      realAmount: realEntry.amount,
      meisAmount,
      diff,
    });
  }

  if (matchedCount === 0) {
    throw new Error(
      "突合可能な店舗が0件でした。Excelの店舗コード形式またはファイル内容を確認してください。",
    );
  }

  const totalDiff = totalRealAmount - totalMeisAmount;

  return {
    realYosanPath,
    meis0120Path,
    realStoreCount: realYosanMap.size,
    meisStoreCount: meisYosanMap.size,
    matchedCount,
    ignoredCount,
    totalRealAmount,
    totalMeisAmount,
    totalDiff,
    comparisons,
  };
}

function extractStoreHeader(
  value: unknown,
): { normalizedCode: string; displayLabel: string } | null {
  const text = extractCellText(value);

  if (!text || CONFIG.existingStoreRegex.test(text)) return null;

  const rawCode = text.match(CONFIG.storeCodeRegex)?.[1];
  if (!rawCode) return null;

  const normalizedCode = normalizeStoreCode(rawCode);
  if (!normalizedCode) return null;

  const normalizedColonText = text.replace("：", ":");
  return {
    normalizedCode,
    displayLabel: formatStoreDisplayLabel(normalizedColonText, normalizedCode),
  };
}

function isTotalRow(value: unknown): boolean {
  const text = extractCellText(value);

  return Boolean(
    text &&
      !CONFIG.existingStoreRegex.test(text) &&
      CONFIG.totalRowRegex.test(text),
  );
}

async function parseRealYosan(filePath: string): Promise<RealYosanMap> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(CONFIG.targetSheetName);
  if (!worksheet) {
    throw new Error(`シート '${CONFIG.targetSheetName}' が見つかりません。`);
  }

  const result: RealYosanMap = new Map();
  let currentStore: { normalizedCode: string; displayLabel: string } | null =
    null;

  worksheet.eachRow((row) => {
    const storeValue = row.getCell(2).value;
    const storeHeader = extractStoreHeader(storeValue);

    if (storeHeader !== null) {
      currentStore = storeHeader;
      return;
    }

    if (currentStore === null || !isTotalRow(storeValue)) return;

    const amount = parseRealYosanAmount(row.getCell(21).value);
    if (amount !== null) {
      result.set(currentStore.normalizedCode, {
        storeCode: currentStore.normalizedCode,
        displayLabel: currentStore.displayLabel,
        amount,
      });
    }
  });

  return result;
}

function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.section("入力ファイル");
  logger.log(`リアル予算 : ${path.basename(result.realYosanPath)}`);
  logger.log(`MEIS0120   : ${path.basename(result.meis0120Path)}`);

  logger.section("集計店舗数");
  logger.log(`リアル予算 : ${result.realStoreCount}件`);
  logger.log(`MD予算     : ${result.meisStoreCount}件`);
  logger.log(
    `突合対象   : ${result.matchedCount}件 (対象外: ${result.ignoredCount}件)`,
  );

  logger.section("集計結果");
  logger.log(`リアル予算計 : ${formatYen(result.totalRealAmount)}`);
  logger.log(`MD予算計     : ${formatYen(result.totalMeisAmount)}`);
  logger.log(`差分         : ${formatSignedYen(result.totalDiff)}`);

  logger.section("店舗別明細");
  const lines = formatAlignedColumns(result.comparisons, [
    {
      prefix: "店舗[",
      getValue: (item) => item.displayLabel,
      align: "left",
      suffix: "]",
    },
    {
      prefix: "リアル: ",
      getValue: (item) => formatYen(item.realAmount),
      align: "right",
    },
    {
      prefix: "MD: ",
      getValue: (item) => formatYen(item.meisAmount),
      align: "right",
    },
    {
      prefix: "差: ",
      getValue: (item) => formatSignedYen(item.diff),
      align: "right",
    },
  ]);

  for (const line of lines) {
    logger.log(line);
  }

  return logger.complete(CONFIG.completionMessage);
}
