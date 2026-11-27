// electron/features/operation/jobs/scripts/numeric/job_20.ts

import fs from "fs-extra";
import path from "node:path";
import { addDays, format } from "date-fns";
import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";

const CONFIG = {
  host: NETWORK_HOSTS.MDSYUHAI01,
  subPaths: ["if", "AUTOORD", "RCV", "SV"] as const,
  targetFileKeyword: "JIDOHAT",
  maxDiffKb: 10000,
  comparisonDays: 7,
} as const;

type FileInfo = {
  fileName: string;
  sizeKb: number;
  mtime: Date;
};

type Job20CheckResult = {
  targetDir: string;
  todayKey: string;
  lastWeekKey: string;
  todayFile: FileInfo | null;
  lastWeekFile: FileInfo | null;
  diffKb: number | null;
  needsAction: boolean;
  message: string | null;
};

/**
 * 本日分と先週分の対象ファイルを比較する。
 */
export async function runJob20(): Promise<string> {
  const targetDir = getNetworkHostPath(CONFIG.host, ...CONFIG.subPaths);
  return runJobWithLogger(
    `対象ファイルの確認中にシステムエラーが発生しました: ${targetDir}`,
    async (logger) => {
      const result = await findTargetFiles(targetDir);
      return writeResultLog(logger, result);
    },
  );
}

function findTargetFile(
  targetDir: string,
  fileNames: readonly string[],
  dateKey: string,
): string | null {
  const targetFile = fileNames.find(
    (name) => name.includes(CONFIG.targetFileKeyword) && name.includes(dateKey),
  );

  return targetFile ? path.join(targetDir, targetFile) : null;
}

async function getFileInfo(filePath: string): Promise<FileInfo> {
  const stats = await withNetworkAuthRetry(filePath, () => fs.stat(filePath));

  return {
    fileName: path.basename(filePath),
    sizeKb: stats.size / 1024,
    mtime: stats.mtime,
  };
}

async function findTargetFiles(targetDir: string): Promise<Job20CheckResult> {
  const now = new Date();
  const todayKey = format(now, "yyMMdd");
  const lastWeekKey = format(addDays(now, -CONFIG.comparisonDays), "yyMMdd");
  const fileNames = await withNetworkAuthRetry(targetDir, () =>
    listFilesInDir(targetDir),
  );

  const todayPath = findTargetFile(targetDir, fileNames, todayKey);

  if (todayPath === null) {
    return {
      targetDir,
      todayKey,
      lastWeekKey,
      todayFile: null,
      lastWeekFile: null,
      diffKb: null,
      needsAction: true,
      message: `本日分の対象ファイルが見つかりません (日付キー: ${todayKey})`,
    };
  }

  const todayFile = await getFileInfo(todayPath);

  const lastWeekPath = findTargetFile(targetDir, fileNames, lastWeekKey);

  if (lastWeekPath === null) {
    return {
      targetDir,
      todayKey,
      lastWeekKey,
      todayFile,
      lastWeekFile: null,
      diffKb: null,
      needsAction: true,
      message: `先週分の対象ファイルが見つかりません (日付キー: ${lastWeekKey})`,
    };
  }

  const lastWeekFile = await getFileInfo(lastWeekPath);
  const diffKb = Math.abs(todayFile.sizeKb - lastWeekFile.sizeKb);

  if (diffKb > CONFIG.maxDiffKb) {
    return {
      targetDir,
      todayKey,
      lastWeekKey,
      todayFile,
      lastWeekFile,
      diffKb,
      needsAction: true,
      message: `ファイルサイズの差分が閾値を超えています (差分: ${diffKb.toFixed(2)} KB, 許容値: ${CONFIG.maxDiffKb} KB)`,
    };
  }

  return {
    targetDir,
    todayKey,
    lastWeekKey,
    todayFile,
    lastWeekFile,
    diffKb,
    needsAction: false,
    message: null,
  };
}

function writeResultLog(logger: JobLogger, result: Job20CheckResult): string {
  logger.log(`対象フォルダ : ${result.targetDir}`);

  logger.section("ファイル確認結果");

  if (result.todayFile !== null) {
    logger.log(`本日分 : ${result.todayFile.fileName}`);
    logger.log(`サイズ : ${result.todayFile.sizeKb.toFixed(2)} KB`);
  }

  if (result.lastWeekFile !== null) {
    logger.log(`先週分 : ${result.lastWeekFile.fileName}`);
    logger.log(`サイズ : ${result.lastWeekFile.sizeKb.toFixed(2)} KB`);
  }

  if (result.diffKb !== null) {
    logger.log(`サイズ差分 : ${result.diffKb.toFixed(2)} KB`);
    logger.log(`許容閾値 : ${CONFIG.maxDiffKb.toFixed(0)} KB`);
  }

  if (result.needsAction) {
    return logger.needsAction(result.message ?? "対象ファイルの確認が必要です");
  }

  logger.log("判定結果 : 正常 (閾値内)");

  return logger.complete();
}