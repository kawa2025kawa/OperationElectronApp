// electron/features/operation/jobs/scripts/numeric/job_16.ts

import path from "node:path";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";

const CONFIG = {
  normalErrorPath: "\\\\192.88.1.3\\syn_tran",
  farmersErrorPath: "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー",
  confirmedPath: "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー\\確認済",
  targetPrefix: "SANSAN_ERROR_",
  cutoffHour: 8,
  cutoffMinute: 30,
} as const;

type JobResultData = {
  targetDir: string;
  targetFile: string | null;
};

export async function runJob16(): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await findTargetFile();
    await moveTargetFile(result);
    return writeResultLog(logger, result);
  });
}

function selectDirectoryByTime(now: Date): string {
  const cutoff = new Date(now);
  cutoff.setHours(CONFIG.cutoffHour, CONFIG.cutoffMinute, 0, 0);

  return now <= cutoff ? CONFIG.normalErrorPath : CONFIG.farmersErrorPath;
}

async function findTargetFile(): Promise<JobResultData> {
  const now = new Date();
  const today = getDateKey(now);
  const searchPattern = `${CONFIG.targetPrefix}${today}`;
  const targetDir = selectDirectoryByTime(now);

  const fileNames = await listFilesInDir(targetDir);
  const targetFile = fileNames.find((name) => name.includes(searchPattern));

  return {
    targetDir,
    targetFile: targetFile ? path.join(targetDir, targetFile) : null,
  };
}

async function moveTargetFile(result: JobResultData): Promise<void> {
  if (result.targetFile === null) {
    return;
  }

  await fs.ensureDir(CONFIG.confirmedPath);

  const destinationPath = path.join(
    CONFIG.confirmedPath,
    path.basename(result.targetFile),
  );

  await fs.move(result.targetFile, destinationPath, {
    overwrite: false,
  });

  result.targetFile = destinationPath;
}

function writeResultLog(logger: JobLogger, result: JobResultData): string {
  if (result.targetFile === null) {
    logger.log("エラーファイルなし");
    return logger.complete();
  }

  logger.section("検出ファイル");
  logger.log(result.targetFile);
  logger.log("バイヤーに対応依頼");

  return logger.needsAction("");
}
