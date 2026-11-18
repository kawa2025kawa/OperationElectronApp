// electron/features/operation/jobs/scripts/eseries/job_e4.ts

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  checkFileUpdatedToday,
  runJobWithLogger,
  type CheckedFileStatus,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";

const CONFIG = {
  targetFiles: [
    "\\\\192.2.2.1\\d$\\BELC\\ftp\\ORDERBOOK.pdf",
    "\\\\192.161.2.1\\d$\\BELC\\ftp\\ORDERBOOK.pdf",
  ],
} as const;

interface JobE4ResultData {
  checkedFiles: CheckedFileStatus[];
  missingFiles: string[];
}

/**
 * 2つの ORDERBOOK.pdf が本日更新されているか確認する。
 */
export async function runJobE4(): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkTargetFiles();
    return writeResultLog(logger, result);
  });
}

async function checkTargetFiles(): Promise<JobE4ResultData> {
  const now = new Date();
  const checkedFiles = await Promise.all(
    CONFIG.targetFiles.map((filePath) => checkFileUpdatedToday(filePath, now)),
  );

  const missingFiles = checkedFiles
    .filter((file) => !file.isToday)
    .map((file) => file.filePath);

  return {
    checkedFiles,
    missingFiles,
  };
}

function writeResultLog(logger: JobLogger, result: JobE4ResultData): string {
  logger.section("対象ファイル");

  for (const file of result.checkedFiles) {
    logger.log(`[${file.isToday ? "本日更新" : "未更新"}] ${file.filePath}`);
  }

  if (result.missingFiles.length > 0) {
    return logger.needsAction(
      `本日更新されていないファイルあり (${result.missingFiles.length}件)`,
    );
  }

  return logger.complete();
}