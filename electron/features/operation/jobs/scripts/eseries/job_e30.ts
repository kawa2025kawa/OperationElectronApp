// electron/features/operation/jobs/scripts/eseries/job_e30.ts

import path from "node:path";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  aggregateCsvAmountByStore,
  formatSignedYen,
  formatYen,
  normalizeStoreCode,
  parseAmount,
  readParsedCsv,
} from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import {
  findFilesByKeywords,
  resolveInputPaths,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import {
  formatAlignedColumns,
  formatStoreDisplayLabel,
} from "@electron/features/operation/jobs/scripts/helpers/logFormatHelper";

const CONFIG = {
  meis0120Keyword: "MEIS0120",
  uriYosanKeyword: "売上予算確認",
  requiredExtension: ".csv",
  csvEncoding: "Shift_JIS",
  startStoreCode: "002",
  endStoreCode: "700",
  completionMessage: "予算差異なし",
} as const;

type UriYosanEntry = {
  storeCode: string;
  displayLabel: string;
  amount: number;
};

type YosanMap = Map<string, UriYosanEntry>;

type StoreComparison = {
  storeCode: string;
  displayLabel: string;
  uriAmount: number;
  meisAmount: number;
  diff: number;
};

type JobResultData = {
  meis0120Path: string;
  uriYosanPath: string;
  meisStoreCount: number;
  uriStoreCount: number;
  matchedCount: number;
  ignoredCount: number;
  totalUriAmount: number;
  totalMeisAmount: number;
  totalDiff: number;
  hasDifference: boolean;
  comparisons: StoreComparison[];
};

/**
- 売上予算確認ファイルと MEIS0120 ファイルを突き合わせ、店舗別および合計の予算差異を検証する。
 */
export async function runJobE30(
  inputFilePath?: string | string[],
): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const inputPaths = resolveInputPaths(inputFilePath);
    const result = await compareBudgets(inputPaths);
    return writeResultLog(logger, result);
  });
}

async function parseUriYosan(filePath: string): Promise<YosanMap> {
  const rows = await readParsedCsv(filePath, CONFIG.csvEncoding);
  const startIndex = rows.findIndex((row) =>
    row[0]?.trim().startsWith(`${CONFIG.startStoreCode}:`),
  );

  if (startIndex === -1) {
    throw new Error(
      `開始店舗コード '${CONFIG.startStoreCode}' が見つかりませんでした`,
    );
  }

  const endIndex = rows.findIndex(
    (row, index) =>
      index >= startIndex &&
      row[0]?.trim().startsWith(`${CONFIG.endStoreCode}:`),
  );
  const validRows =
    endIndex === -1
      ? rows.slice(startIndex)
      : rows.slice(startIndex, endIndex + 1);

  const result: YosanMap = new Map();

  for (const row of validRows) {
    const rawCell = row[0]?.trim() ?? "";
    if (!rawCell) continue;

    const normalizedCode = normalizeStoreCode(rawCell);
    if (!normalizedCode) continue;

    const amount = parseAmount(row[1]);
    if (amount === null) continue;

    result.set(normalizedCode, {
      storeCode: normalizedCode,
      displayLabel: formatStoreDisplayLabel(rawCell, normalizedCode),
      amount,
    });
  }

  return result;
}

async function compareBudgets(inputPaths: string[]): Promise<JobResultData> {
  if (inputPaths.length === 0) {
    throw new Error("比較対象ファイルがありません。");
  }

  const { meis0120Path, uriYosanPath } = findFilesByKeywords(
    inputPaths,
    {
      meis0120Path: CONFIG.meis0120Keyword,
      uriYosanPath: CONFIG.uriYosanKeyword,
    },
    {
      requiredExtension: CONFIG.requiredExtension,
      exactMatchCount: true,
    },
  );

  const [meisMap, uriMap] = await Promise.all([
    aggregateCsvAmountByStore(
      meis0120Path,
      CONFIG.csvEncoding,
      undefined,
      true,
    ),
    parseUriYosan(uriYosanPath),
  ]);

  let matchedCount = 0;
  let ignoredCount = 0;
  let totalUriAmount = 0;
  let totalMeisAmount = 0;
  let hasDifference = false;

  const comparisons: StoreComparison[] = [];
  const sortedCodes = [...uriMap.keys()].sort(
    (a, b) => Number(a) - Number(b),
  );

  for (const storeCode of sortedCodes) {
    const uriEntry = uriMap.get(storeCode)!;

    if (!meisMap.has(storeCode)) {
      ignoredCount++;
      continue;
    }

    const meisAmount = meisMap.get(storeCode)!;
    const diff = uriEntry.amount - meisAmount;

    matchedCount++;
    totalUriAmount += uriEntry.amount;
    totalMeisAmount += meisAmount;

    if (Math.abs(diff) > 0.0001) {
      hasDifference = true;
    }

    comparisons.push({
      storeCode,
      displayLabel: uriEntry.displayLabel,
      uriAmount: uriEntry.amount,
      meisAmount,
      diff,
    });
  }

  if (matchedCount === 0) {
    throw new Error(
      "突合可能な店舗が0件でした。CSVの店舗コード形式またはファイル内容を確認してください。",
    );
  }

  const totalDiff = totalUriAmount - totalMeisAmount;
  if (Math.abs(totalDiff) > 0.0001) {
    hasDifference = true;
  }

  return {
    meis0120Path,
    uriYosanPath,
    meisStoreCount: meisMap.size,
    uriStoreCount: uriMap.size,
    matchedCount,
    ignoredCount,
    totalUriAmount,
    totalMeisAmount,
    totalDiff,
    hasDifference,
    comparisons,
  };
}

function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.section("入力ファイル");
  logger.log(`MEIS0120 : ${path.basename(result.meis0120Path)}`);
  logger.log(`売上予算 : ${path.basename(result.uriYosanPath)}`);

  logger.section("集計店舗数");
  logger.log(`MEIS0120 : ${result.meisStoreCount}件`);
  logger.log(`売上予算 : ${result.uriStoreCount}件`);
  logger.log(
    `突合対象 : ${result.matchedCount}件 (対象外: ${result.ignoredCount}件)`,
  );

  logger.section("合計結果");
  logger.log(`売上予算計 : ${formatYen(result.totalUriAmount)}`);
  logger.log(`MEIS予算計 : ${formatYen(result.totalMeisAmount)}`);
  logger.log(`差額合計   : ${formatSignedYen(result.totalDiff)}`);

  logger.section("店舗別明細");
  const lines = formatAlignedColumns(result.comparisons, [
    {
      prefix: "店舗[",
      getValue: (item) => item.displayLabel,
      align: "left",
      suffix: "]",
    },
    {
      prefix: "予算: ",
      getValue: (item) => formatYen(item.uriAmount),
      align: "right",
    },
    {
      prefix: "MEIS: ",
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

  if (result.hasDifference) {
    return logger.needsAction(
      `予算差異が発生しています (差額合計: ${formatSignedYen(result.totalDiff)})`,
    );
  }

  return logger.complete(CONFIG.completionMessage);
}
