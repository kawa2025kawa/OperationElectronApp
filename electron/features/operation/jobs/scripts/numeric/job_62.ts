// electron/features/operation/jobs/scripts/numeric/job_62.ts

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV",
  expectedFiles: [
    { keyword: "htsf0060", count: 1 },
    { keyword: "Syohin_toMD_N", count: 4 },
    { keyword: "Tokusyo_toMD_N", count: 4 },
  ],
} as const;

type FileMatchResult = {
  keyword: string;
  expectedCount: number;
  actualCount: number;
  missingCount: number;
  fileNames: string[];
};

type JobResultData = {
  targetDir: string;
  results: FileMatchResult[];
  hasMismatch: boolean;
};

/**
 * 指定フォルダ内のキーワード別ファイル件数が想定通りであるかを確認する。
 */
export async function runJob62(): Promise<JobResult> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkExpectedFiles();
    return writeResultLog(logger, result);
  });
}

async function checkExpectedFiles(): Promise<JobResultData> {
  const fileNames = await listFilesInDir(CONFIG.targetDir);

  const results: FileMatchResult[] = CONFIG.expectedFiles.map(
    ({ keyword, count }) => {
      const matchedFiles = fileNames.filter((fileName) =>
        fileName.includes(keyword),
      );
      const actualCount = matchedFiles.length;
      const missingCount = Math.max(0, count - actualCount);

      return {
        keyword,
        expectedCount: count,
        actualCount,
        missingCount,
        fileNames: matchedFiles,
      };
    },
  );

  const hasMismatch = results.some(
    (item) => item.actualCount !== item.expectedCount,
  );

  return {
    targetDir: CONFIG.targetDir,
    results,
    hasMismatch,
  };
}

function writeResultLog(logger: JobLogger, result: JobResultData): JobResult {
  logger.section("対象フォルダ");
  logger.log(result.targetDir);
  logger.log();

  logger.section("対象ファイル");
  for (const item of result.results) {
    logger.log(
      `${item.keyword} (検出: ${item.actualCount}, 未検出: ${item.missingCount})`,
    );
  }
  logger.log();

  if (result.hasMismatch) {
    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(),
      data: result,
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete(),
    data: result,
  };
}
