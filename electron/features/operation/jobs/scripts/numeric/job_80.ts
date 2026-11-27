// electron/features/operation/jobs/scripts/numeric/job_80.ts

import path from "node:path";
import fs from "fs-extra";
import type { JobResult } from "@shared/types/operation/operationTypes";
import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import {
  formatDateTime,
  getDateKey,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";

const CONFIG = {
  host: NETWORK_HOSTS.MDSYUHAI01,
  subPaths: ["if", "MASTER", "RCV", "SV"] as const,
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
 * 事前連携ファイル（Okurikomi_toMD_JIZEN, htsf0060_JIZEN）の存在を確認する。
 */
export async function runJob80(): Promise<JobResult> {
  return runJobWithLogger("ファイル確認に失敗しました", async (logger) => {
    const result = await checkRequiredFiles();
    return writeResultLog(logger, result);
  });
}

async function findMatchedFile(
  targetDir: string,
  fileNames: readonly string[],
  prefix: string,
): Promise<MatchedFile | null> {
  const matchedName = fileNames.find((name) => name.startsWith(prefix));

  if (!matchedName) {
    return null;
  }

  const filePath = path.join(targetDir, matchedName);
  const stat = await fs.stat(filePath);

  return {
    fileName: matchedName,
    filePath,
    mtime: stat.mtime,
  };
}

async function findRequiredFiles(
  targetDir: string,
  fileNames: readonly string[],
  prefixes: readonly string[],
): Promise<(MatchedFile | null)[]> {
  return Promise.all(
    prefixes.map((prefix) => findMatchedFile(targetDir, fileNames, prefix)),
  );
}

async function checkRequiredFiles(): Promise<JobResultData> {
  const targetDir = getNetworkHostPath(CONFIG.host, ...CONFIG.subPaths);
  return withNetworkAuthRetry(targetDir, async () => {
    const fileNames = await listFilesInDir(targetDir);
    const fixedFiles = await findRequiredFiles(
      targetDir,
      fileNames,
      CONFIG.requiredFiles,
    );

    if (fixedFiles.every((file) => file !== null)) {
      return {
        targetDir,
        files: fixedFiles,
        missing: [],
      };
    }

    const datedFiles = await findRequiredFiles(
      targetDir,
      fileNames,
      CONFIG.requiredFiles.map((target) => `${target}_${getDateKey()}`),
    );

    return {
      targetDir,
      files: datedFiles,
      missing: CONFIG.requiredFiles.filter(
        (_, index) => datedFiles[index] === null,
      ),
    };
  });
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