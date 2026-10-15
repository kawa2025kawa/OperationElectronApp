import fs from "fs-extra";
import path from "node:path";
import iconv from "iconv-lite";
import { isSameDay } from "date-fns";
import type { JobResult } from "@shared/types/operation/operationTypes";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const OUTPUT_DIR = "\\\\C0088150\\nec\\ftp";
const TARGET_FILE = "TENF0140.dat";
const ENCODING = "Windows-31J";

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

const TARGET_DEPTS = ["01", "21", "03", "23", "04", "24", "05", "25"];
const TARGET_STORE = "003";

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

function padEndEastAsian(str: string, targetWidth: number): string {
  const currentWidth = getStringWidth(str);

  if (currentWidth >= targetWidth) return str;

  return str + " ".repeat(targetWidth - currentWidth);
}

function formatNumber(valStr: string): string {
  const num = Number(valStr);

  return Number.isNaN(num) ? valStr : num.toLocaleString("en-US");
}

export async function runJobE55(): Promise<JobResult> {
  const logger = new JobLogger();

  try {
    const datPath = path.join(OUTPUT_DIR, TARGET_FILE);

    logger.log(`確認対象ファイル : ${datPath}`);

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
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

    logger.log(`読み込み行数 : ${lines.length}`);

    let storeCode = "";
    let startDate = "";
    let endDate = "";

    const deptDataMap: Record<
      string,
      { purchase: string; transfer: string; sales: string }
    > = {};

    for (const line of lines) {
      const cols = line.split(",").map((column) => column.trim());

      if (cols.length < 7) continue;

      const [dept, store, purchase, transfer, sales, start, end] = cols;
      const normalizedStore = store.padStart(3, "0");

      if (normalizedStore !== TARGET_STORE || !TARGET_DEPTS.includes(dept)) {
        continue;
      }

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

    if (!storeCode) {
      storeCode = TARGET_STORE;
    }

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

    const message = summaryLines.join("\n");

    logger.log(`対象店舗 : ${storeCode}`);
    logger.log(`集計対象部門数 : ${TARGET_DEPTS.length}`);
    logger.complete("送信済みデータ確認完了");

    return { message };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}
