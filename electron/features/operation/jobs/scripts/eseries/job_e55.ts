// electron/features/operation/jobs/scripts/eseries/job_e55.ts

import fs from "fs-extra";
import iconv from "iconv-lite";
import { isSameDay } from "date-fns";
import type { JobResult } from "@shared/types/operation/operationTypes";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

export type JobE55CheckStatus =
  | "SUCCESS"
  | "NOT_UPDATED_TODAY"
  | "LINE_NOT_FOUND"
  | "LINE_MISMATCH";

export interface TargetLineDetailE55 {
  dept: string;
  store: string;
  purchase: string;
  transfer: string;
  sales: string;
  startDate: string;
  endDate: string;
}

export interface JobE55ResultData {
  status: JobE55CheckStatus;
  invalidFilePath?: string;
  detail?: TargetLineDetailE55;
}

const CONFIG = {
  sourcePath: "\\\\192.12.2.1\\d$\\BELC\\ftp\\PC0140.dat",
  targetPath: "\\\\C0088150\\nec\\ftp\\TENF0140.dat",
  encoding: "Windows-31J",
  targetLinePrefix: "01,012,",
  targetStoreName: "宮地店 (012)",
  targetDeptName: "01",
} as const;

/**
 * e5 仕入原価リストデータ作成完了後の整合性チェックを行う（対象: 3.宮地店）。
 *
 * 確認先:
 * - PC0140.dat: \\192.12.2.1\d$\BELC\ftp\PC0140.dat
 * - TENF0140.dat: \\C0088150\nec\ftp\TENF0140.dat
 *
 * 業務上の要対応:
 * - いずれかのファイルが存在しない、または本日更新でない場合
 * - PC0140.dat に対象行（部門01・店番号012）が存在しない場合
 * - PC0140.dat と TENF0140.dat で対象行の内容が一致しない場合
 *
 * システムエラー:
 * - ファイル読み込み・デコード失敗
 */
export async function runJobE55(): Promise<JobResult> {
  const logger = new JobLogger();

  try {
    const result = await checkCostListData();

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
 * ファイルが存在し、更新日が本日であるかを確認する。
 */
async function isUpdatedToday(filePath: string): Promise<boolean> {
  if (!(await fs.pathExists(filePath))) {
    return false;
  }

  const fileStat = await fs.stat(filePath);
  return isSameDay(fileStat.mtime, new Date());
}

/**
 * 指定エンコーディングでテキスト行配列を読み込む。
 */
async function readLines(filePath: string): Promise<string[]> {
  const buffer = await fs.readFile(filePath);
  return iconv
    .decode(buffer, CONFIG.encoding)
    .split(/\r?\n/)
    .filter((line) => line.trim());
}

/**
 * 対象ファイルの更新日時および仕入原価データの整合性を検証する。
 */
async function checkCostListData(): Promise<JobE55ResultData> {
  for (const filePath of [CONFIG.sourcePath, CONFIG.targetPath]) {
    if (!(await isUpdatedToday(filePath))) {
      return {
        status: "NOT_UPDATED_TODAY",
        invalidFilePath: filePath,
      };
    }
  }

  const [sourceLines, targetLines] = await Promise.all([
    readLines(CONFIG.sourcePath),
    readLines(CONFIG.targetPath),
  ]);

  const targetLine = sourceLines.find((line) =>
    line.startsWith(CONFIG.targetLinePrefix),
  );

  if (!targetLine) {
    return {
      status: "LINE_NOT_FOUND",
    };
  }

  const [dept, store, purchase, transfer, sales, startDate, endDate] =
    targetLine.split(",");

  const detail: TargetLineDetailE55 = {
    dept,
    store,
    purchase,
    transfer,
    sales,
    startDate,
    endDate,
  };

  if (!targetLines.includes(targetLine)) {
    return {
      status: "LINE_MISMATCH",
      detail,
    };
  }

  return {
    status: "SUCCESS",
    detail,
  };
}

/**
 * 検証結果をログ出力し、JobResult を返却する。
 */
function writeResultLog(
  logger: JobLogger,
  result: JobE55ResultData,
): JobResult {
  logger.section("確認対象ファイル");
  logger.log(`元データ   : ${CONFIG.sourcePath}`);
  logger.log(`送信データ : ${CONFIG.targetPath}`);

  if (result.status === "NOT_UPDATED_TODAY") {
    return {
      message: logger.needsAction(
        `ファイルが存在しないか、更新日が本日ではありません: ${result.invalidFilePath}`,
      ),
    };
  }

  if (result.status === "LINE_NOT_FOUND") {
    return {
      message: logger.needsAction(
        `PC0140.datに部門01・店番号012のデータがありません。`,
      ),
    };
  }

  if (result.detail) {
    logger.section(`抽出データ (${CONFIG.targetStoreName})`);
    logger.log(`店番号       : ${result.detail.store}`);
    logger.log(`部門         : ${result.detail.dept}`);
    logger.log(`仕入原価税抜 : ${result.detail.purchase}`);
    logger.log(`振替原価税抜 : ${result.detail.transfer}`);
    logger.log(`売上計税抜   : ${result.detail.sales}`);
    logger.log(`開始日       : ${result.detail.startDate}`);
    logger.log(`終了日       : ${result.detail.endDate}`);
  }

  if (result.status === "LINE_MISMATCH") {
    return {
      message: logger.needsAction(
        "PC0140.datとTENF0140.datの対象行が一致しません。",
      ),
    };
  }

  return {
    message: logger.complete(),
  };
}
