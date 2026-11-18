// electron/features/operation/jobs/scripts/eseries/job_e55.ts

import type { JobResult } from "@shared/types/operation/operationTypes";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  checkFileUpdatedToday,
  readEncodedLines,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";

type JobE55CheckStatus =
  | "SUCCESS"
  | "NOT_UPDATED_TODAY"
  | "LINE_NOT_FOUND"
  | "LINE_MISMATCH";

interface TargetLineDetailE55 {
  dept: string;
  store: string;
  purchase: string;
  transfer: string;
  sales: string;
  startDate: string;
  endDate: string;
}

interface JobE55ResultData {
  status: JobE55CheckStatus;
  invalidFilePath?: string;
  detail?: TargetLineDetailE55;
}

const CONFIG = {
  sourcePath: "\\\\192.12.2.1\\d$\\BELC\\ftp\\PC0140.dat",
  targetPath: "\\\\C0088150\\nec\\ftp\\TENF0140.dat",
  encoding: "Windows-31J",
  targetLinePrefix: "01,012,",
  targetStoreName: "12.すねおり店",
  targetDeptName: "01",
} as const;

/**
 * e5 仕入原価リストデータ作成完了後の整合性チェックを行う（対象: 12.すねおり店）
 */
export async function runJobE55(): Promise<JobResult> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkCostListData();
    return writeResultLog(logger, result);
  });
}

async function checkCostListData(): Promise<JobE55ResultData> {
  const now = new Date();
  for (const filePath of [CONFIG.sourcePath, CONFIG.targetPath]) {
    const status = await checkFileUpdatedToday(filePath, now);
    if (!status.isToday) {
      return {
        status: "NOT_UPDATED_TODAY",
        invalidFilePath: filePath,
      };
    }
  }

  const [sourceLines, targetLines] = await Promise.all([
    readEncodedLines(CONFIG.sourcePath, CONFIG.encoding),
    readEncodedLines(CONFIG.targetPath, CONFIG.encoding),
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