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
  fileNames: string[];
};

type JobResultData = {
  targetDir: string;
  results: FileMatchResult[];
  missingErrors: string[];
  excessErrors: string[];
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

  const missingErrors: string[] = [];
  const excessErrors: string[] = [];
  const results: FileMatchResult[] = [];

  for (const { keyword, count } of CONFIG.expectedFiles) {
    const matchedFiles = fileNames.filter((fileName) =>
      fileName.includes(keyword),
    );

    results.push({
      keyword,
      expectedCount: count,
      actualCount: matchedFiles.length,
      fileNames: matchedFiles,
    });

    if (matchedFiles.length < count) {
      missingErrors.push(
        `${keyword} (期待: ${count}, 検出: ${matchedFiles.length})`,
      );
    } else if (matchedFiles.length > count) {
      excessErrors.push(
        `${keyword} (期待: ${count}, 検出: ${matchedFiles.length})`,
      );
    }
  }

  return {
    targetDir: CONFIG.targetDir,
    results,
    missingErrors,
    excessErrors,
  };
}

function writeResultLog(logger: JobLogger, result: JobResultData): JobResult {
  logger.log(`対象フォルダ : ${result.targetDir}`);

  logger.section("検出ファイル");
  for (const item of result.results) {
    for (const fileName of item.fileNames) {
      logger.log(fileName);
    }
  }

  if (result.excessErrors.length > 0) {
    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(
        `ファイル件数超過:\n${result.excessErrors.join("\n")}`,
      ),
      data: result,
    };
  }

  if (result.missingErrors.length > 0) {
    logger.section("未検出・件数不足ファイル");
    for (const err of result.missingErrors) {
      logger.log(`${err}（配置待ち）`);
    }

    return {
      success: true,
      kind: "running",
      message: logger.complete(
        `ファイル未達 (${result.missingErrors.join(", ")})。バックグラウンドで監視中`,
      ),
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