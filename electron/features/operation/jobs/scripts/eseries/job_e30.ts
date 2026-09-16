// electron/features/operation/jobs/scripts/job_e30.ts

import path from "node:path";
import fs from "fs-extra";
import { parseAmount } from "../helpers/shared/parseAmount";
import { parseCsv } from "../helpers/shared/parseCsvLine";

type YosanMap = Map<string, number>;

// ============================================================
// 1. ヘルパー関数（店舗コード正規化 & CSV読み込み）
// ============================================================
function normalizeStoreCode(value: string): string {
  const codePart = value.split(":")[0]?.trim() ?? value;
  const numericOnly = codePart.replace(/[^0-9]/g, "");
  const num = Number.parseInt(numericOnly, 10);
  return Number.isNaN(num)
    ? value.trim().slice(0, 3)
    : String(num).padStart(3, "0");
}

async function readShiftJisCsv(filePath: string): Promise<string[][]> {
  const buffer = await fs.readFile(filePath);
  const decoder = new TextDecoder("shift-jis");
  return parseCsv(decoder.decode(buffer));
}

// ============================================================
// 2. CSV解析ロジック（MEIS予算 & 売上予算）
// ============================================================
async function parseMeisYosan(filePath: string): Promise<YosanMap> {
  const rows = await readShiftJisCsv(filePath);
  const resultMap: YosanMap = new Map();

  for (const row of rows.slice(1)) {
    const rawStoreCode = row[0]?.trim() ?? "";
    if (!rawStoreCode) continue;

    const amount = parseAmount(row[4]);
    if (amount !== null) {
      const storeCode = normalizeStoreCode(rawStoreCode);
      resultMap.set(storeCode, (resultMap.get(storeCode) ?? 0) + amount);
    }
  }
  return resultMap;
}

async function parseUriYosan(filePath: string): Promise<YosanMap> {
  const rows = await readShiftJisCsv(filePath);

  // 開始店舗コード '002' と 終了店舗コード '700' のインデックスを抽出
  const startIndex = rows.findIndex((row) => row[0]?.trim().includes("002"));
  if (startIndex === -1) {
    throw new Error("開始店舗コード '002' が見つかりませんでした");
  }

  const endIndex = rows.findIndex(
    (row, idx) => idx >= startIndex && row[0]?.trim().includes("700"),
  );
  const validRows =
    endIndex !== -1 ? rows.slice(startIndex, endIndex) : rows.slice(startIndex);

  const resultMap: YosanMap = new Map();
  for (const row of validRows) {
    const rawLabel = row[0]?.trim() ?? "";
    const amount = parseAmount(row[1]);
    if (rawLabel && amount !== null) {
      resultMap.set(normalizeStoreCode(rawLabel), amount);
    }
  }
  return resultMap;
}

// ============================================================
// 3. 入力ファイル探索
// ============================================================
function findInputFiles(inputPaths: string[]): {
  meis0120Path: string;
  uriYosanPath: string;
} {
  const meis0120Path = inputPaths.find((p) =>
    path.basename(p).includes("MEIS0120"),
  );
  const uriYosanPath = inputPaths.find((p) =>
    path.basename(p).includes("売上予算確認"),
  );

  if (!meis0120Path)
    throw new Error("必要なファイルが不足しています: MEIS0120");
  if (!uriYosanPath)
    throw new Error("必要なファイルが不足しています: 売上予算確認");

  return { meis0120Path, uriYosanPath };
}

// ============================================================
// 4. メインジョブ関数 (runJobE30)
// ============================================================
export async function runJobE30(
  inputFilePath?: string | string[],
): Promise<string> {
  const inputPaths = inputFilePath
    ? Array.isArray(inputFilePath)
      ? inputFilePath
      : [inputFilePath]
    : [];
  if (inputPaths.length === 0) {
    throw new Error("比較対象ファイルがありません。");
  }

  const { meis0120Path, uriYosanPath } = findInputFiles(inputPaths);

  const [meisMap, uriMap] = await Promise.all([
    parseMeisYosan(meis0120Path),
    parseUriYosan(uriYosanPath),
  ]);

  let matchedCount = 0;
  let ignoredCount = 0;
  let hasDifference = false;
  let totalUriAmount = 0;
  let totalMeisAmount = 0;

  const detailLines: string[] = [];
  const sortedStoreCodes = Array.from(uriMap.keys()).sort();

  for (const storeCode of sortedStoreCodes) {
    const uriAmount = uriMap.get(storeCode)!;

    if (!meisMap.has(storeCode)) {
      ignoredCount++;
      continue;
    }

    matchedCount++;
    const meisAmount = meisMap.get(storeCode)!;
    const diff = uriAmount - meisAmount;

    totalUriAmount += uriAmount;
    totalMeisAmount += meisAmount;

    if (Math.abs(diff) > 0.0001) {
      hasDifference = true;
    }

    const diffSign =
      diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString();
    detailLines.push(
      `店舗[${storeCode}] 予算:${uriAmount.toLocaleString()}円 | MEIS:${meisAmount.toLocaleString()}円 | 差:${diffSign}円`,
    );
  }

  const totalDiff = totalUriAmount - totalMeisAmount;
  const totalDiffSign =
    totalDiff > 0
      ? `+${totalDiff.toLocaleString()}`
      : totalDiff.toLocaleString();
  const statusHeader = hasDifference ? "【相違あり】" : "【相違なし】";

  const headerLines = [
    `${statusHeader} (突合:${matchedCount}件, 対象外:${ignoredCount}件)`,
    `[合計] 売上予算: ${totalUriAmount.toLocaleString()}円 | MEIS: ${totalMeisAmount.toLocaleString()}円 | 差額: ${totalDiffSign}円`,
    "--------------------------------------------------------------------------------",
  ];

  const resultComment = `${headerLines.join("\n")}\n${detailLines.join("\n")}`;

  if (hasDifference) {
    throw new Error(resultComment);
  }

  return resultComment;
}
