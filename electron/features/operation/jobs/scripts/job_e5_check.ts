// electron/features/operation/jobs/scripts/job_e5_check.ts

import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { isSameDay } from "date-fns";
import type { JobResult } from "@shared/types/operation";

const OUTPUT_DIR = "\\\\C0088150\\nec\\ftp";
const TARGET_FILE = "TENF0140.dat";
const ENCODING = "Windows-31J";

// 対象となる部門コードと部門名のマッピング
const DEPT_MAP: Record<string, string> = {
  "01": "01:青果",
  "21": "21:青果加工品",
  "03": "03:海産",
  "23": "23:練製品",
  "04": "04:精肉",
  "24": "24:加工肉",
  "05": "05:デリカ",
  "25": "25:和日配",
};

// 表示対象の部門コード（順序固定）
const TARGET_DEPTS = ["01", "21", "03", "23", "04", "24", "05", "25"];

// 抽出対象の店番号（3桁固定）
const TARGET_STORE = "003";

/**
 * 全角文字を考慮した表示幅計算（全角=2, 半角=1）
 */
function getStringWidth(str: string): number {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x3000) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * 全角・半角混在文字列の右パディング
 */
function padEndEastAsian(str: string, targetWidth: number): string {
  const currentWidth = getStringWidth(str);
  if (currentWidth >= targetWidth) return str;
  return str + " ".repeat(targetWidth - currentWidth);
}

/**
 * 数値を3桁カンマ区切りに整形
 */
function formatNumber(valStr: string): string {
  const num = Number(valStr);
  return Number.isNaN(num) ? valStr : num.toLocaleString("en-US");
}

export async function runJobE5Check(): Promise<JobResult> {
  const datPath = path.join(OUTPUT_DIR, TARGET_FILE);

  if (!(await fs.pathExists(datPath))) {
    throw new Error(`送信済みファイルが存在しません: ${datPath}`);
  }

  const stat = await fs.stat(datPath);
  if (!isSameDay(stat.mtime, new Date())) {
    throw new Error(
      `ファイル (${TARGET_FILE}) の更新日時が本日ではありません。本日の送信処理がまだ行われていない可能性があります。`,
    );
  }

  const fileBuffer = await fs.readFile(datPath);
  const text = iconv.decode(fileBuffer, ENCODING);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

  let storeCode = "";
  let startDate = "";
  let endDate = "";

  const deptDataMap: Record<
    string,
    { purchase: string; transfer: string; sales: string }
  > = {};

  for (const line of lines) {
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 7) continue;

    const [dept, store, purchase, transfer, sales, start, end] = cols;

    // 店舗コードを3桁ゼロ埋め整形（例: "3" -> "003"）
    const normalizedStore = store.padStart(3, "0");

    // 対象の店番号 (003) かつ 対象の部門コード (01, 21, 03...) の組み合わせのみ抽出
    if (normalizedStore === TARGET_STORE && TARGET_DEPTS.includes(dept)) {
      if (!storeCode) {
        storeCode = normalizedStore;
        startDate = start;
        endDate = end;
      }

      deptDataMap[dept] = {
        purchase: formatNumber(purchase),
        transfer: formatNumber(transfer),
        sales: formatNumber(sales),
      };
    }
  }

  if (!storeCode) {
    storeCode = TARGET_STORE;
  }

  // 表示フォーマットの定義
  const DEPT_WIDTH = 14;
  const NUM_WIDTH = 16;

  const headerDept = padEndEastAsian("部門", DEPT_WIDTH);
  const headerPur = "仕入原価(税抜)".padStart(NUM_WIDTH, " ");
  const headerTra = "振替原価(税抜)".padStart(NUM_WIDTH, " ");
  const headerSal = "売上計(税抜)".padStart(NUM_WIDTH, " ");

  const summaryLines: string[] = [
    "【送信済みデータ確認】",
    `【店番号】 ${storeCode}`,
    `【日 付】 ${startDate} ～ ${endDate}`,
    "",
    "-".repeat(68),
    `${headerDept} | ${headerPur} | ${headerTra} | ${headerSal}`,
    "-".repeat(68),
  ];

  for (const deptCode of TARGET_DEPTS) {
    const rawDeptName = DEPT_MAP[deptCode] || deptCode;
    const deptName = padEndEastAsian(rawDeptName, DEPT_WIDTH);

    const data = deptDataMap[deptCode] || {
      purchase: "0",
      transfer: "0",
      sales: "0",
    };

    const purchaseStr = data.purchase.padStart(NUM_WIDTH, " ");
    const transferStr = data.transfer.padStart(NUM_WIDTH, " ");
    const salesStr = data.sales.padStart(NUM_WIDTH, " ");

    summaryLines.push(
      `${deptName} | ${purchaseStr} | ${transferStr} | ${salesStr}`,
    );
  }

  summaryLines.push("-".repeat(68));

  return {
    message: summaryLines.join("\n"),
  };
}
