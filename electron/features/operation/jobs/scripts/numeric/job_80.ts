// electron/features/operation/jobs/scripts/numeric/job_80.ts

import path from "node:path";
import fs from "fs-extra";
import type { JobResult } from "@shared/types/operation/operationTypes";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  listFilesInExistingDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import {
  formatDateTime,
  getDateKey,
} from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  requiredFiles: ["Okurikomi_toMD_JIZEN", "htsf0060_JIZEN"],
} as const;

interface MatchedFile {
  fileName: string;
  filePath: string;
  mtime: Date;
}

type JobResultData = {
  targetDir: string;
  files: (MatchedFile | null)[];
  missing: string[];
};

/**
- 事前連携ファイル（Okurikomi_toMD_JIZEN, htsf0060_JIZEN）の存在を確認する。
 */
export async function runJob80(): Promise<JobResult> {
  return runJobWithLogger("ファイル確認に失敗しました", async (logger) => {
    const result = await checkRequiredFiles();
    return writeResultLog(logger, result);
  });
}

async function findMatchedFile(
  fileNames: readonly string[],
  prefix: string,
): Promise<MatchedFile | null> {
  const matchedName = fileNames.find((name) => name.startsWith(prefix));

  if (!matchedName) {
    return null;
  }

  const filePath = path.join(CONFIG.targetDir, matchedName);
  const stat = await fs.stat(filePath);

  return {
    fileName: matchedName,
    filePath,
    mtime: stat.mtime,
  };
}

async function findRequiredFiles(
  fileNames: readonly string[],
  prefixes: readonly string[],
): Promise<(MatchedFile | null)[]> {
  return Promise.all(
    prefixes.map((prefix) => findMatchedFile(fileNames, prefix)),
  );
}

async function checkRequiredFiles(): Promise<JobResultData> {
  const fileNames = await listFilesInExistingDir(
    CONFIG.targetDir,
    `フォルダが存在しません: ${CONFIG.targetDir}`,
  );
  const fixedFiles = await findRequiredFiles(fileNames, CONFIG.requiredFiles);

  if (fixedFiles.every((file) => file !== null)) {
    return {
      targetDir: CONFIG.targetDir,
      files: fixedFiles,
      missing: [],
    };
  }

  const datedFiles = await findRequiredFiles(
    fileNames,
    CONFIG.requiredFiles.map((target) => `${target}_${getDateKey()}`),
  );

  return {
    targetDir: CONFIG.targetDir,
    files: datedFiles,
    missing: CONFIG.requiredFiles.filter(
      (_, index) => datedFiles[index] === null,
    ),
  };
}

function writeResultLog(logger: JobLogger, result: JobResultData): JobResult {
  logger.log(`対象フォルダ : ${result.targetDir}`);
  logger.section("検出ファイル");

  for (let index = 0; index < CONFIG.requiredFiles.length; index += 1) {
    const file = result.files[index];

    if (file) {
      logger.log(`  ${file.fileName}`);
      logger.log(`    更新日時 : ${formatDateTime(file.mtime)}`);
    } else {
      logger.log(
        `  [${CONFIG.requiredFiles[index]}] ファイルが見つかりません（配置待ち）`,
      );
    }
  }

  if (result.missing.length > 0) {
    return {
      success: true,
      kind: "running",
      message: logger.complete(
        `ファイル未検出 (対象: ${result.missing.join(", ")})。バックグラウンドで監視中`,
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
