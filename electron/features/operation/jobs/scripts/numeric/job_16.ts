// electron/features/operation/jobs/scripts/numeric/job_16.ts

import path from "node:path";
import fs from "fs-extra";
import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  getDateKey,
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";

const CONFIG = {
  host: NETWORK_HOSTS.SYN_TRAN_192_88,
  normalErrorSubPaths: ["syn_tran"] as const,
  farmersErrorSubPaths: ["syn_tran", "ファーマーズエラー"] as const,
  confirmedSubPaths: ["syn_tran", "ファーマーズエラー", "確認済"] as const,
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

  const subPaths =
    now <= cutoff ? CONFIG.normalErrorSubPaths : CONFIG.farmersErrorSubPaths;
  return getNetworkHostPath(CONFIG.host, ...subPaths);
}

async function findTargetFile(): Promise<JobResultData> {
  const now = new Date();
  const today = getDateKey(now);
  const searchPattern = `${CONFIG.targetPrefix}${today}`;
  const targetDir = selectDirectoryByTime(now);

  const fileNames = await withNetworkAuthRetry(targetDir, () =>
    listFilesInDir(targetDir),
  );
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

  const confirmedPath = getNetworkHostPath(
    CONFIG.host,
    ...CONFIG.confirmedSubPaths,
  );
  await withNetworkAuthRetry(confirmedPath, () =>
    fs.ensureDir(confirmedPath),
  );

  const destinationPath = path.join(
    confirmedPath,
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