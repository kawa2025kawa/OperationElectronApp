// electron/features/operation/jobs/scripts/eseries/job_e9.ts

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  checkAndArchiveTodayFiles,
  listFilesInDir,
  logCheckedFiles,
  logDateIssuesAndNeedsAction,
  runJobWithLogger,
  type CheckedFileStatus,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";

interface JobE9ResultData {
  matchedFiles: CheckedFileStatus[];
  dateIssueFiles: CheckedFileStatus[];
  zipFilePath?: string | null;
}

const CONFIG = {
  targetDir: "\\\\S0088003\\syn_tran\\from_ACOS\\SendData",
  expectedFileCount: 16,
  filePrefix: "FPOPHAT",
  fileExtension: ".TXT",
  zipPrefix: "SendData_POP",
} as const;

/**
- POP関連ファイル（FPOPHAT*.TXT 16件）の存在と更新日を確認し、ZIPアーカイブを作成する。
 */
export async function runJobE9(): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkAndArchiveFiles();
    return writeResultLog(logger, result);
  });
}

async function checkAndArchiveFiles(): Promise<JobE9ResultData> {
  const fileNames = await listFilesInDir(CONFIG.targetDir);

  const matchedNames = fileNames.filter((name) => {
    const upperName = name.toUpperCase();
    return (
      upperName.startsWith(CONFIG.filePrefix) &&
      upperName.endsWith(CONFIG.fileExtension)
    );
  });

  return checkAndArchiveTodayFiles(
    CONFIG.targetDir,
    matchedNames,
    CONFIG.zipPrefix,
    matchedNames.length === CONFIG.expectedFileCount,
  );
}

function writeResultLog(logger: JobLogger, result: JobE9ResultData): string {
  logger.section("対象フォルダ");
  logger.log(CONFIG.targetDir);

  logCheckedFiles(logger, result.matchedFiles);

  if (result.zipFilePath) {
    logger.section("出力先");
    logger.log(result.zipFilePath);
  }

  if (result.matchedFiles.length !== CONFIG.expectedFileCount) {
    logger.section("件数不整合");
    logger.log(
      `検出数: ${result.matchedFiles.length}件 / 想定件数: ${CONFIG.expectedFileCount}件`,
    );

    return logger.needsAction(
      `検出ファイル数が不正です (検出: ${result.matchedFiles.length}件 / 想定: ${CONFIG.expectedFileCount}件)`,
    );
  }

  if (result.dateIssueFiles.length > 0) {
    return logDateIssuesAndNeedsAction(logger, result.dateIssueFiles);
  }

  if (!result.zipFilePath) {
    throw logger.fail("ZIPアーカイブの作成に失敗しました。");
  }

  return logger.complete();
}