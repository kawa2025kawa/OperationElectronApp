// electron/features/operation/jobs/scripts/eseries/job_e30.ts

import path from "node:path";
import fs from "fs-extra";
import iconv from "iconv-lite";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { parseCsv } from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import { parseAmount } from "../helpers/parseAmount";

const CONFIG = {
  meis0120Keyword: "MEIS0120",
  uriYosanKeyword: "売上予算確認",
  csvEncoding: "Shift_JIS",
  startStoreCode: "002",
  endStoreCode: "700",
  completionMessage: "予算差異なし",
} as const;

type YosanMap = Map<string, number>;

type StoreComparison = {
  storeCode: string;
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
 * 売上予算確認ファイルと MEIS0120 ファイルを突き合わせ、店舗別および合計の予算差異を検証する。
 *
 * 入力ファイル:
 * - MEIS0120 CSVファイル
 * - 売上予算確認 CSVファイル（開始コード: 002 〜 終了コード: 700）
 *
 * 業務上の要対応:
 * - 店舗別または合計で予算差異（相違あり）が発生している場合
 *
 * システムエラー:
 * - 入力ファイル未指定・不足
 * - 開始店舗コード（002）不在
 * - CSV読み込み・パース失敗
 */
export async function runJobE30(
  inputFilePath?: string | string[],
): Promise<string> {
  const logger = new JobLogger();

  try {
    const inputPaths = resolveInputPaths(inputFilePath);
    const result = await compareBudgets(inputPaths);

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`ファイル処理に失敗しました${detail}`);
  }
}

/**
 * 入力ファイルパス配列を平坦化・正規化する。
 */
function resolveInputPaths(inputFilePath?: string | string[]): string[] {
  if (!inputFilePath) return [];
  return Array.isArray(inputFilePath) ? inputFilePath : [inputFilePath];
}

/**
 * 入力パスから対象ファイル（MEIS0120、売上予算確認）を特定・検証する。
 */
function findTargetFiles(inputPaths: string[]): {
  meis0120Path: string;
  uriYosanPath: string;
} {
  const meis0120Path = inputPaths.find((filePath) =>
    path.basename(filePath).includes(CONFIG.meis0120Keyword),
  );
  const uriYosanPath = inputPaths.find((filePath) =>
    path.basename(filePath).includes(CONFIG.uriYosanKeyword),
  );

  const missing: string[] = [];
  if (!meis0120Path) missing.push(CONFIG.meis0120Keyword);
  if (!uriYosanPath) missing.push(CONFIG.uriYosanKeyword);

  if (missing.length > 0) {
    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  return {
    meis0120Path: meis0120Path!,
    uriYosanPath: uriYosanPath!,
  };
}

/**
 * Shift_JIS エンコードの CSV ファイルを読み込みパースする。
 */
async function readShiftJisCsv(filePath: string): Promise<string[][]> {
  const buffer = await fs.readFile(filePath);
  const decodedText = iconv.decode(buffer, CONFIG.csvEncoding);
  return parseCsv(decodedText);
}

/**
 * MEIS0120 CSVファイルを読み込み、店舗別予算Mapを生成する。
 */
async function parseMeisYosan(filePath: string): Promise<YosanMap> {
  const rows = (await readShiftJisCsv(filePath)).slice(1);
  const result = new Map<string, number>();

  for (const row of rows) {
    const storeCode = row[0];
    if (!storeCode) continue;

    const amount = parseAmount(row[4]);
    if (amount === null) continue;

    result.set(storeCode, (result.get(storeCode) ?? 0) + amount);
  }

  return result;
}

/**
 * 売上予算確認 CSVファイルを読み込み、指定範囲の店舗別予算Mapを生成する。
 */
async function parseUriYosan(filePath: string): Promise<YosanMap> {
  const rows = await readShiftJisCsv(filePath);
  const startIndex = rows.findIndex((row) =>
    row[0]?.includes(CONFIG.startStoreCode),
  );

  if (startIndex === -1) {
    throw new Error(
      `開始店舗コード '${CONFIG.startStoreCode}' が見つかりませんでした`,
    );
  }

  const endIndex = rows.findIndex(
    (row, index) =>
      index >= startIndex && row[0]?.includes(CONFIG.endStoreCode),
  );
  const validRows =
    endIndex === -1 ? rows.slice(startIndex) : rows.slice(startIndex, endIndex);

  const result = new Map<string, number>();

  for (const row of validRows) {
    const storeCode = row[0];
    if (!storeCode) continue;

    const amount = parseAmount(row[1]);
    if (amount === null) continue;

    result.set(storeCode, amount);
  }

  return result;
}

/**
 * 両ファイルをパースし、店舗別・合計の突き合わせ検証を行う。
 */
async function compareBudgets(inputPaths: string[]): Promise<JobResultData> {
  if (inputPaths.length === 0) {
    throw new Error("比較対象ファイルがありません。");
  }

  const { meis0120Path, uriYosanPath } = findTargetFiles(inputPaths);

  const [meisMap, uriMap] = await Promise.all([
    parseMeisYosan(meis0120Path),
    parseUriYosan(uriYosanPath),
  ]);

  let matchedCount = 0;
  let ignoredCount = 0;
  let totalUriAmount = 0;
  let totalMeisAmount = 0;
  let hasDifference = false;

  const comparisons: StoreComparison[] = [];

  for (const storeCode of [...uriMap.keys()].sort()) {
    const uriAmount = uriMap.get(storeCode)!;

    if (!meisMap.has(storeCode)) {
      ignoredCount++;
      continue;
    }

    const meisAmount = meisMap.get(storeCode)!;
    const diff = uriAmount - meisAmount;

    matchedCount++;
    totalUriAmount += uriAmount;
    totalMeisAmount += meisAmount;

    if (Math.abs(diff) > 0.0001) {
      hasDifference = true;
    }

    comparisons.push({
      storeCode,
      uriAmount,
      meisAmount,
      diff,
    });
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

/**
 * 金額を日本円表記にフォーマットする。
 */
function formatAmount(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

/**
 * 符号付き金額文字列を生成する。
 */
function formatSignedAmount(amount: number): string {
  const formatted = formatAmount(amount);
  return amount > 0 ? `+${formatted}` : formatted;
}

/**
 * 検証結果をログに出力し、最終ステータスを判定する。
 */
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
  logger.log(`売上予算計 : ${formatAmount(result.totalUriAmount)}`);
  logger.log(`MEIS予算計 : ${formatAmount(result.totalMeisAmount)}`);
  logger.log(`差額合計   : ${formatSignedAmount(result.totalDiff)}`);

  logger.section("店舗別明細");
  for (const item of result.comparisons) {
    logger.log(
      `店舗[${item.storeCode}] 予算:${formatAmount(item.uriAmount)} | MEIS:${formatAmount(item.meisAmount)} | 差:${formatSignedAmount(item.diff)}`,
    );
  }

  if (result.hasDifference) {
    return logger.needsAction(
      `予算差異が発生しています (差額合計: ${formatSignedAmount(result.totalDiff)})`,
    );
  }

  return logger.complete(CONFIG.completionMessage);
}
