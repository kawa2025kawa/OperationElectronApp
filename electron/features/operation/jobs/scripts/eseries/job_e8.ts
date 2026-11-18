// electron/features/operation/jobs/scripts/eseries/job_e8.ts

import path from "node:path";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  checkFileUpdatedToday,
  createDesktopZip,
  listFilesInDir,
  logCheckedFiles,
  logDateIssuesAndNeedsAction,
  runJobWithLogger,
  type CheckedFileStatus,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";

const TARGET_FILES_E8 = [
  "JCATANAWARI.TXT",
  "JCAPRIPC2.TXT",
  "SHELF_ERR_DATA.TXT",
] as const;

interface JobE8ResultData {
  matchedFiles: CheckedFileStatus[];
  missingFiles: string[];
  dateIssueFiles: CheckedFileStatus[];
  zipFilePath?: string | null;
}

const CONFIG = {
  targetDir: "\\\\S0088003\\syn_tran\\from_ACOS\\SendData",
  targetFiles: TARGET_FILES_E8,
  zipPrefix: "SendData_Shelf",
} as const;

/**
 * 棚割関連ファイル（3ファイル）の存在と更新日を確認し、ZIPアーカイブを作成する。
 */
export async function runJobE8(): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkAndArchiveFiles();
    return writeResultLog(logger, result);
  });
}

async function checkAndArchiveFiles(): Promise<JobE8ResultData> {
  const now = new Date();
  const currentFileSet = new Set(await listFilesInDir(CONFIG.targetDir));
  const missingFiles = CONFIG.targetFiles.filter(
    (fileName) => !currentFileSet.has(fileName),
  );

  const presentFiles = CONFIG.targetFiles.filter((fileName) =>
    currentFileSet.has(fileName),
  );

  const matchedFiles = await Promise.all(
    presentFiles.map((fileName) =>
      checkFileUpdatedToday(path.join(CONFIG.targetDir, fileName), now),
    ),
  );

  const dateIssueFiles = matchedFiles.filter((file) => !file.isToday);

  if (missingFiles.length > 0 || dateIssueFiles.length > 0) {
    return {
      matchedFiles,
      missingFiles,
      dateIssueFiles,
    };
  }

  const zipFilePath = await createDesktopZip(
    matchedFiles.map((file) => file.filePath),
    CONFIG.zipPrefix,
  );

  return {
    matchedFiles,
    missingFiles,
    dateIssueFiles,
    zipFilePath,
  };
}

function writeResultLog(logger: JobLogger, result: JobE8ResultData): string {
  logger.section("対象フォルダ");
  logger.log(CONFIG.targetDir);

  logCheckedFiles(logger, result.matchedFiles);

  if (result.zipFilePath) {
    logger.section("出力先");
    logger.log(result.zipFilePath);
  }

  if (result.missingFiles.length > 0) {
    logger.section("不足ファイル");
    for (const fileName of result.missingFiles) {
      logger.log(fileName);
    }

    return logger.needsAction(
      `不足ファイルあり (対象: ${result.missingFiles.join(", ")})`,
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