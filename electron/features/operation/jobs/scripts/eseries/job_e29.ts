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
  formatYen,
  parseRealYosanAmount,
} from "../helpers/parseAmount";

const CONFIG = {
  realYosanKeyword: "リアル予算",
  meis0120Keyword: "MEIS0120",
  targetSheetName: "店舗毎（税抜き）",
  csvEncoding: "Shift_JIS",
  forbiddenKeys: new Set(["11", "24", "43", "57", "59", "88", "94", "98"]),
  storeCodeRegex: /^(\d{3})\s*[:：]/,
  totalRowRegex: /^合[\s\u3000]*計$/,
  existingStoreRegex: /既存/,
  completionMessage: "予算集計完了",
} as const;

type YosanMap = Map<string, number>;

type JobResultData = {
  realYosanPath: string;
  meis0120Path: string;
  realStoreCount: number;
  meisStoreCount: number;
  totalRealAmount: number;
  totalMeisAmount: number;
  diffAmount: number;
};

/**
- リアル予算（Excel）と MD予算（MEIS0120 CSV）を集計し、各予算合計および差分を算出・確認する。
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

async function aggregateBudgets(inputPaths: string[]): Promise<JobResultData> {
  if (inputPaths.length === 0) {
    throw new Error("入力ファイルが指定されていません");
  }

  const { realYosanPath, meis0120Path } = findFilesByKeywords(inputPaths, {
    realYosanPath: CONFIG.realYosanKeyword,
    meis0120Path: CONFIG.meis0120Keyword,
  });

  const [realYosanMap, meisYosanMap] = await Promise.all([
    parseRealYosan(realYosanPath),
    aggregateCsvAmountByStore(
      meis0120Path,
      CONFIG.csvEncoding,
      CONFIG.forbiddenKeys,
    ),
  ]);

  const totalRealAmount = sumYosan(realYosanMap);
  const totalMeisAmount = sumYosan(meisYosanMap);
  const diffAmount = totalRealAmount - totalMeisAmount;

  return {
    realYosanPath,
    meis0120Path,
    realStoreCount: realYosanMap.size,
    meisStoreCount: meisYosanMap.size,
    totalRealAmount,
    totalMeisAmount,
    diffAmount,
  };
}

function extractStoreCode(value: unknown): string | null {
  const text = extractCellText(value);

  if (!text || CONFIG.existingStoreRegex.test(text)) return null;

  return text.match(CONFIG.storeCodeRegex)?.[1] ?? null;
}

function isTotalRow(value: unknown): boolean {
  const text = extractCellText(value);

  return Boolean(
    text &&
      !CONFIG.existingStoreRegex.test(text) &&
      CONFIG.totalRowRegex.test(text),
  );
}

async function parseRealYosan(filePath: string): Promise<YosanMap> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(CONFIG.targetSheetName);
  if (!worksheet) {
    throw new Error(`シート '${CONFIG.targetSheetName}' が見つかりません。`);
  }

  const result = new Map<string, number>();
  let currentStoreCode: string | null = null;

  worksheet.eachRow((row) => {
    const storeValue = row.getCell(2).value;
    const storeCode = extractStoreCode(storeValue);

    if (storeCode !== null) {
      currentStoreCode = storeCode;
      return;
    }

    if (currentStoreCode === null || !isTotalRow(storeValue)) return;

    const amount = parseRealYosanAmount(row.getCell(21).value);
    if (amount !== null) result.set(currentStoreCode, amount);
  });

  return result;
}

function sumYosan(map: YosanMap): number {
  return [...map.values()].reduce((sum, amount) => sum + amount, 0);
}

function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.section("入力ファイル");
  logger.log(`リアル予算 : ${path.basename(result.realYosanPath)}`);
  logger.log(`MEIS0120   : ${path.basename(result.meis0120Path)}`);

  logger.section("集計店舗数");
  logger.log(`リアル予算 : ${result.realStoreCount}件`);
  logger.log(`MD予算     : ${result.meisStoreCount}件`);

  logger.section("集計結果");
  logger.log(`リアル予算計 : ${formatYen(result.totalRealAmount)}`);
  logger.log(`MD予算計     : ${formatYen(result.totalMeisAmount)}`);
  logger.log(`差分         : ${formatYen(result.diffAmount)}`);

  return logger.complete(CONFIG.completionMessage);
}