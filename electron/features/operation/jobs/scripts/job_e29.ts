// electron/features/operation/jobs/scripts/job_e29.ts

import path from "node:path";
import fs from "fs-extra";
import Workbook from "exceljs";
import {
  parseAmount,
  parseRealYosanAmount,
} from "./helpers/shared/parseAmount";
import { parseCsv } from "./helpers/shared/parseCsvLine";

// ============================================================
// 1. 定数 & 定義
// ============================================================
const TARGET_SHEET_NAME = "店舗毎（税抜き）";
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

const STORE_CODE_REGEX = /^(\d{3})\s*[:：]/;
const TOTAL_ROW_REGEX = /^合[\s\u3000]*計$/;
const EXISTING_STORE_REGEX = /既存/;

type YosanMap = Map<string, number>;

// ============================================================
// 2. セル文字列・店舗コード変換ヘルパー
// ============================================================
function parseCellString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.result != null) return parseCellString(obj.result);
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((i: any) => i?.text ?? "")
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

function extractStoreCode(value: unknown): string | null {
  const text = parseCellString(value);
  if (!text || EXISTING_STORE_REGEX.test(text)) return null;
  return text.match(STORE_CODE_REGEX)?.[1] ?? null;
}

function isTotalRow(value: unknown): boolean {
  const text = parseCellString(value);
  return text && !EXISTING_STORE_REGEX.test(text)
    ? TOTAL_ROW_REGEX.test(text)
    : false;
}

// ============================================================
// 3. データ解析ロジック (MEIS予算 / リアル予算)
// ============================================================
async function parseMeisYosan(filePath: string): Promise<YosanMap> {
  const csv = await fs.readFile(filePath, "utf8");
  const rows = parseCsv(csv).slice(1);
  const resultMap: YosanMap = new Map();

  for (const row of rows) {
    const storeCode = row[0]?.trim() ?? "";
    if (!storeCode || FORBIDDEN_KEYS.has(storeCode)) continue;

    const amount = parseAmount(row[4]);
    if (amount !== null) {
      resultMap.set(storeCode, (resultMap.get(storeCode) ?? 0) + amount);
    }
  }
  return resultMap;
}

async function parseRealYosan(filePath: string): Promise<YosanMap> {
  const workbook = new Workbook.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(TARGET_SHEET_NAME);
  if (!worksheet)
    throw new Error(`シート '${TARGET_SHEET_NAME}' が見つかりません。`);

  const resultMap: YosanMap = new Map();
  let currentStoreCode: string | null = null;

  worksheet.eachRow((row) => {
    const columnB = row.getCell(2).value;
    const columnU = row.getCell(21).value;

    const storeCode = extractStoreCode(columnB);
    if (storeCode !== null) {
      currentStoreCode = storeCode;
      return;
    }

    if (!isTotalRow(columnB) || currentStoreCode === null) return;

    const amount = parseRealYosanAmount(columnU);
    if (amount !== null) {
      resultMap.set(currentStoreCode, amount);
    }
  });

  return resultMap;
}

// ============================================================
// 4. 入力ファイル探索 & 集計計算
// ============================================================
function findInputFiles(inputPaths: string[]): {
  realYosanPath: string;
  meis0120Path: string;
} {
  const realYosanPath = inputPaths.find((p) =>
    path.basename(p).includes("リアル予算"),
  );
  const meis0120Path = inputPaths.find((p) =>
    path.basename(p).includes("MEIS0120"),
  );

  if (!realYosanPath || !meis0120Path) {
    const missing: string[] = [];
    if (!realYosanPath) missing.push("リアル予算");
    if (!meis0120Path) missing.push("MEIS0120");
    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  return { realYosanPath, meis0120Path };
}

function buildSummaryComment(realMap: YosanMap, meisMap: YosanMap): string {
  const sumValues = (map: YosanMap) =>
    [...map.values()].reduce((sum, v) => sum + v, 0);

  const totalReal = sumValues(realMap);
  const totalMd = sumValues(meisMap);
  const totalDiff = totalReal - totalMd;

  const formatYen = (num: number) => `${num.toLocaleString("ja-JP")}円`;

  return [
    `リアル予算計=${formatYen(totalReal)}`,
    `MD予算計=${formatYen(totalMd)}`,
    `差分=${formatYen(totalDiff)}`,
  ].join(" / ");
}

// ============================================================
// 5. メインジョブ関数 (runJobE29)
// ============================================================
export async function runJobE29(
  inputFilePath?: string | string[],
): Promise<string> {
  const inputPaths = inputFilePath
    ? Array.isArray(inputFilePath)
      ? inputFilePath
      : [inputFilePath]
    : [];
  if (inputPaths.length === 0) {
    throw new Error("入力ファイルが指定されていません");
  }

  const { realYosanPath, meis0120Path } = findInputFiles(inputPaths);

  const [realYosanMap, meisYosanMap] = await Promise.all([
    parseRealYosan(realYosanPath),
    parseMeisYosan(meis0120Path),
  ]);

  return buildSummaryComment(realYosanMap, meisYosanMap);
}
