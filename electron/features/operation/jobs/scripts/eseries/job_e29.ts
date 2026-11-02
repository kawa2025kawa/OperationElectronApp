// electron/features/operation/jobs/scripts/eseries/job_e29.ts

import path from "node:path";
import fs from "fs-extra";
import iconv from "iconv-lite";
import * as ExcelJS from "exceljs";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { parseCsv } from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import { parseAmount, parseRealYosanAmount } from "../helpers/parseAmount";

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

interface ExcelCellObject {
  result?: unknown;
  richText?: { text?: string }[];
}

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
 * リアル予算（Excel）と MD予算（MEIS0120 CSV）を集計し、各予算合計および差分を算出・確認する。
 *
 * 入力ファイル:
 * - リアル予算 Excelファイル（シート: 店舗毎（税抜き））
 * - MEIS0120 CSVファイル（Shift_JIS）
 *
 * 業務上の要対応:
 * - なし（集計結果と差分を出力して正常終了）
 *
 * システムエラー:
 * - 入力ファイル未指定・不足
 * - 対象シート不在
 * - ファイル読み込み・パース失敗
 */
export async function runJobE29(
  inputFilePath?: string | string[],
): Promise<string> {
  const logger = new JobLogger();

  try {
    const inputPaths = resolveInputPaths(inputFilePath);
    const result = await aggregateBudgets(inputPaths);

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
 * 入力パスから対象ファイル（リアル予算、MEIS0120）を特定・検証する。
 */
function findTargetFiles(inputPaths: string[]): {
  realYosanPath: string;
  meis0120Path: string;
} {
  const realYosanPath = inputPaths.find((filePath) =>
    path.basename(filePath).includes(CONFIG.realYosanKeyword),
  );
  const meis0120Path = inputPaths.find((filePath) =>
    path.basename(filePath).includes(CONFIG.meis0120Keyword),
  );

  const missing: string[] = [];
  if (!realYosanPath) missing.push(CONFIG.realYosanKeyword);
  if (!meis0120Path) missing.push(CONFIG.meis0120Keyword);

  if (missing.length > 0) {
    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  return {
    realYosanPath: realYosanPath!,
    meis0120Path: meis0120Path!,
  };
}

/**
 * リアル予算・MD予算ファイルを並列で集計し、結果データを算出する。
 */
async function aggregateBudgets(inputPaths: string[]): Promise<JobResultData> {
  if (inputPaths.length === 0) {
    throw new Error("入力ファイルが指定されていません");
  }

  const { realYosanPath, meis0120Path } = findTargetFiles(inputPaths);

  const [realYosanMap, meisYosanMap] = await Promise.all([
    parseRealYosan(realYosanPath),
    parseMeisYosan(meis0120Path),
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

/**
 * Excelセルの値をプレーン文字列として抽出する。
 */
function parseCellString(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "object") {
    const cell = value as ExcelCellObject;

    if (cell.result != null) return parseCellString(cell.result);

    if (Array.isArray(cell.richText)) {
      return cell.richText
        .map((item) => item.text ?? "")
        .join("")
        .trim();
    }
  }

  return String(value).trim();
}

/**
 * セル値から店舗コード（3桁数値）を抽出する。
 */
function extractStoreCode(value: unknown): string | null {
  const text = parseCellString(value);

  if (!text || CONFIG.existingStoreRegex.test(text)) return null;

  return text.match(CONFIG.storeCodeRegex)?.[1] ?? null;
}

/**
 * セル値が合計行であるかを判定する。
 */
function isTotalRow(value: unknown): boolean {
  const text = parseCellString(value);

  return Boolean(
    text &&
    !CONFIG.existingStoreRegex.test(text) &&
    CONFIG.totalRowRegex.test(text),
  );
}

/**
 * MEIS0120 CSVファイルを読み込み、店舗別予算Mapを生成する。
 */
async function parseMeisYosan(filePath: string): Promise<YosanMap> {
  const rawBuffer = await fs.readFile(filePath);
  const text = iconv.decode(rawBuffer, CONFIG.csvEncoding);
  const rows = parseCsv(text).slice(1);
  const result = new Map<string, number>();

  for (const row of rows) {
    const storeCode = row[0]?.trim() ?? "";

    if (!storeCode || CONFIG.forbiddenKeys.has(storeCode)) continue;

    const amount = parseAmount(row[4]);
    if (amount === null) continue;

    result.set(storeCode, (result.get(storeCode) ?? 0) + amount);
  }

  return result;
}

/**
 * リアル予算 Excelファイルを読み込み、店舗別予算Mapを生成する。
 */
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

/**
 * 予算Mapの合計値を算出する。
 */
function sumYosan(map: YosanMap): number {
  return [...map.values()].reduce((sum, amount) => sum + amount, 0);
}

/**
 * 金額を日本円表記にフォーマットする。
 */
function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

/**
 * 集計結果をログに出力し、完了メッセージを返却する。
 */
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
