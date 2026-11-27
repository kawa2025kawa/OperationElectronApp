// electron/features/operation/jobs/scripts/eseries/job_e8.ts

import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  checkAndArchiveTodayFiles,
  listFilesInDir,
  logCheckedFiles,
  logDateIssuesAndNeedsAction,
  runJobWithLogger,
  type CheckedFileStatus,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";

const TARGET_FILES_E8 = [
  "JCATANAWARI.TXT",
  "JCAPRIPC2.TXT",
  "SHELF_ERR_DATA.TXT",
] as const;

interface JobE8ResultData {
  targetDir: string;
  matchedFiles: CheckedFileStatus[];
  missingFiles: string[];
  dateIssueFiles: CheckedFileStatus[];
  zipFilePath?: string | null;
}

const CONFIG = {
  host: NETWORK_HOSTS.S0088003,
  subPaths: ["syn_tran", "from_ACOS", "SendData"] as const,
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
  const targetDir = getNetworkHostPath(CONFIG.host, ...CONFIG.subPaths);
  const currentFileSet = new Set(
    await withNetworkAuthRetry(targetDir, () => listFilesInDir(targetDir)),
  );
  const missingFiles = CONFIG.targetFiles.filter(
    (fileName) => !currentFileSet.has(fileName),
  );
  const presentFiles = CONFIG.targetFiles.filter((fileName) =>
    currentFileSet.has(fileName),
  );

  const archived = await checkAndArchiveTodayFiles(
    targetDir,
    presentFiles,
    CONFIG.zipPrefix,
    missingFiles.length === 0,
  );

  return {
    targetDir,
    ...archived,
    missingFiles,
  };
}

function writeResultLog(logger: JobLogger, result: JobE8ResultData): string {
  logger.section("対象フォルダ");
  logger.log(result.targetDir);

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