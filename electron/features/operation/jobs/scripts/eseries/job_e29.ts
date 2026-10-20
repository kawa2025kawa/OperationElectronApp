// electron/features/operation/jobs/scripts/eseries/job_e29.ts

import path from "node:path";
import fs from "fs-extra";
import iconv from "iconv-lite";
import * as ExcelJS from "exceljs";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { parseCsv } from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import { parseAmount, parseRealYosanAmount } from "../helpers/parseAmount";

const CONFIG = {
  targetSheetName: "店舗毎（税抜き）",
  forbiddenKeys: new Set(["11", "24", "43", "57", "59", "88", "94", "98"]),
  storeCodeRegex: /^(\d{3})\s*[:：]/,
  totalRowRegex: /^合[\s\u3000]*計$/,
  existingStoreRegex: /既存/,
} as const;

type YosanMap = Map<string, number>;

interface ExcelCellObject {
  result?: unknown;
  richText?: { text?: string }[];
}

function normalizeInputPaths(inputFilePath?: string | string[]): string[] {
  if (!inputFilePath) return [];
  return Array.isArray(inputFilePath) ? inputFilePath : [inputFilePath];
}

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

function extractStoreCode(value: unknown): string | null {
  const text = parseCellString(value);

  if (!text || CONFIG.existingStoreRegex.test(text)) return null;

  return text.match(CONFIG.storeCodeRegex)?.[1] ?? null;
}

function isTotalRow(value: unknown): boolean {
  const text = parseCellString(value);

  return Boolean(
    text &&
    !CONFIG.existingStoreRegex.test(text) &&
    CONFIG.totalRowRegex.test(text),
  );
}

async function parseMeisYosan(filePath: string): Promise<YosanMap> {
  const rawBuffer = await fs.readFile(filePath);
  const text = iconv.decode(rawBuffer, "Shift_JIS");
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

function findInputFiles(inputPaths: string[]): {
  realYosanPath: string;
  meis0120Path: string;
} {
  const realYosanPath = inputPaths.find((filePath) =>
    path.basename(filePath).includes("リアル予算"),
  );
  const meis0120Path = inputPaths.find((filePath) =>
    path.basename(filePath).includes("MEIS0120"),
  );

  const missing = [
    !realYosanPath && "リアル予算",
    !meis0120Path && "MEIS0120",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  return {
    realYosanPath: realYosanPath!,
    meis0120Path: meis0120Path!,
  };
}

function sumYosan(map: YosanMap): number {
  return [...map.values()].reduce((sum, amount) => sum + amount, 0);
}

function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

function buildSummaryComment(realMap: YosanMap, meisMap: YosanMap): string {
  const totalReal = sumYosan(realMap);
  const totalMeis = sumYosan(meisMap);
  const totalDiff = totalReal - totalMeis;

  return [
    `リアル予算計=${formatYen(totalReal)}`,
    `MD予算計=${formatYen(totalMeis)}`,
    `差分=${formatYen(totalDiff)}`,
  ].join(" / ");
}

export async function runJobE29(
  inputFilePath?: string | string[],
): Promise<string> {
  const logger = new JobLogger();
  logger.log("リアル予算・MD予算の集計を開始します");

  try {
    const inputPaths = normalizeInputPaths(inputFilePath);

    if (inputPaths.length === 0) {
      throw new Error("入力ファイルが指定されていません");
    }

    logger.log(`入力ファイル数 : ${inputPaths.length}件`);

    for (const filePath of inputPaths) {
      logger.log(`入力ファイル : ${path.basename(filePath)}`);
    }

    const { realYosanPath, meis0120Path } = findInputFiles(inputPaths);

    logger.log(`リアル予算ファイル : ${path.basename(realYosanPath)}`);
    logger.log(`MEIS0120ファイル : ${path.basename(meis0120Path)}`);

    const [realYosanMap, meisYosanMap] = await Promise.all([
      parseRealYosan(realYosanPath),
      parseMeisYosan(meis0120Path),
    ]);

    logger.log(`リアル予算集計店舗数 : ${realYosanMap.size}件`);
    logger.log(`MD予算集計店舗数 : ${meisYosanMap.size}件`);

    const summary = buildSummaryComment(realYosanMap, meisYosanMap);
    logger.log(`集計結果 : ${summary}`);

    return logger.complete("予算集計完了");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw logger.fail(message);
  }
}
