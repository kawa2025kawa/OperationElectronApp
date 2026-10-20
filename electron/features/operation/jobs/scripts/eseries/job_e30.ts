// electron/features/operation/jobs/scripts/eseries/job_e30.ts

import path from "node:path";
import fs from "fs-extra";
import iconv from "iconv-lite";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { parseCsv } from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import { parseAmount } from "../helpers/parseAmount";

type YosanMap = Map<string, number>;

function normalizeInputPaths(inputFilePath?: string | string[]): string[] {
  if (!inputFilePath) return [];
  return Array.isArray(inputFilePath) ? inputFilePath : [inputFilePath];
}

async function readShiftJisCsv(filePath: string): Promise<string[][]> {
  const buffer = await fs.readFile(filePath);
  const decodedText = iconv.decode(buffer, "Shift_JIS");
  return parseCsv(decodedText);
}

async function parseMeisYosan(filePath: string): Promise<YosanMap> {
  const rows = (await readShiftJisCsv(filePath)).slice(1);
  const result = new Map<string, number>();

  for (const row of rows) {
    const storeCode = row[0]; // csvUtils 側でトリム・パース済み
    if (!storeCode) continue;

    const amount = parseAmount(row[4]);
    if (amount === null) continue;

    result.set(storeCode, (result.get(storeCode) ?? 0) + amount);
  }

  return result;
}

async function parseUriYosan(filePath: string): Promise<YosanMap> {
  const rows = await readShiftJisCsv(filePath);
  const startIndex = rows.findIndex((row) => row[0]?.includes("002"));

  if (startIndex === -1) {
    throw new Error("開始店舗コード '002' が見つかりませんでした");
  }

  const endIndex = rows.findIndex(
    (row, index) => index >= startIndex && row[0]?.includes("700"),
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

function findInputFiles(inputPaths: string[]): {
  meis0120Path: string;
  uriYosanPath: string;
} {
  const meis0120Path = inputPaths.find((filePath) =>
    path.basename(filePath).includes("MEIS0120"),
  );
  const uriYosanPath = inputPaths.find((filePath) =>
    path.basename(filePath).includes("売上予算確認"),
  );

  const missing = [
    !meis0120Path && "MEIS0120",
    !uriYosanPath && "売上予算確認",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  return {
    meis0120Path: meis0120Path!,
    uriYosanPath: uriYosanPath!,
  };
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

function formatSignedAmount(amount: number): string {
  const formatted = formatAmount(amount);
  return amount > 0 ? `+${formatted}` : formatted;
}

function buildComparisonResult(
  meisMap: YosanMap,
  uriMap: YosanMap,
): { comment: string; hasDifference: boolean } {
  let matchedCount = 0;
  let ignoredCount = 0;
  let totalUriAmount = 0;
  let totalMeisAmount = 0;
  let hasDifference = false;

  const detailLines: string[] = [];

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

    if (Math.abs(diff) > 0.0001) hasDifference = true;

    detailLines.push(
      `店舗[${storeCode}] 予算:${formatAmount(uriAmount)}円 | MEIS:${formatAmount(meisAmount)}円 | 差:${formatSignedAmount(diff)}円`,
    );
  }

  const totalDiff = totalUriAmount - totalMeisAmount;
  const status = hasDifference ? "【相違あり】" : "【相違なし】";

  const headerLines = [
    `${status} (突合:${matchedCount}件, 対象外:${ignoredCount}件)`,
    `[合計] 売上予算: ${formatAmount(totalUriAmount)}円 | MEIS: ${formatAmount(totalMeisAmount)}円 | 差額: ${formatSignedAmount(totalDiff)}円`,
    "--------------------------------------------------------------------------------",
  ];

  return {
    comment: `${headerLines.join("\n")}\n${detailLines.join("\n")}`,
    hasDifference,
  };
}

export async function runJobE30(
  inputFilePath?: string | string[],
): Promise<string> {
  const logger = new JobLogger();
  logger.log("売上予算とMEIS予算の比較を開始します");

  try {
    const inputPaths = normalizeInputPaths(inputFilePath);

    if (inputPaths.length === 0) {
      throw new Error("比較対象ファイルがありません。");
    }

    logger.log(`入力ファイル数 : ${inputPaths.length}件`);

    for (const filePath of inputPaths) {
      logger.log(`入力ファイル : ${path.basename(filePath)}`);
    }

    const { meis0120Path, uriYosanPath } = findInputFiles(inputPaths);

    logger.log(`MEIS0120ファイル : ${path.basename(meis0120Path)}`);
    logger.log(`売上予算ファイル : ${path.basename(uriYosanPath)}`);

    const [meisMap, uriMap] = await Promise.all([
      parseMeisYosan(meis0120Path),
      parseUriYosan(uriYosanPath),
    ]);

    logger.log(`MEIS集計店舗数 : ${meisMap.size}件`);
    logger.log(`売上予算集計店舗数 : ${uriMap.size}件`);

    const { comment, hasDifference } = buildComparisonResult(meisMap, uriMap);

    logger.log("比較結果 :");
    for (const line of comment.split("\n")) {
      logger.log(line);
    }

    if (hasDifference) {
      throw new Error(comment);
    }

    return logger.complete("予算差異なし");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw logger.fail(message);
  }
}
