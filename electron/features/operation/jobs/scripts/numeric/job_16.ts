// electron/features/operation/jobs/scripts/numeric/job_16.ts

import fs from "fs-extra";
import path from "node:path";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  normalErrorPath: "\\\\192.88.1.3\\syn_tran",
  farmersErrorPath: "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー",
  targetPrefix: "SANSAN_ERROR_",
  extension: ".txt",
  cutoffHour: 8,
  cutoffMinute: 30,
} as const;

// timeUtils の getDateKey をローカル関数として実装
function getDateKey(date: Date): string {
  return format(date, "yyyyMMdd");
}

// folderUtils の directoryExists をローカル関数として実装
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// folderUtils の selectDirectoryByTime をローカル関数として実装
function selectDirectoryByTime(
  now: Date,
  normalPath: string,
  farmersPath: string,
  cutoffHour: number,
  cutoffMinute: number,
): string {
  const cutoff = new Date(now);
  cutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

  return now < cutoff ? farmersPath : normalPath;
}

// fileUtils の findFiles をローカル関数として実装
async function findFiles(
  dirPath: string,
  options: { prefix?: string; suffix?: string } = {},
): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => {
      if (!entry.isFile()) return false;
      if (options.prefix && !entry.name.startsWith(options.prefix)) {
        return false;
      }
      if (options.suffix && !entry.name.endsWith(options.suffix)) {
        return false;
      }
      return true;
    })
    .map((entry) => path.join(dirPath, entry.name));
}

// fileUtils の getFileInfo をローカル関数として実装
async function getFileInfo(filePath: string): Promise<{
  fileName: string;
  mtime: Date;
}> {
  const fileStat = await fs.stat(filePath);

  return {
    fileName: path.basename(filePath),
    mtime: fileStat.mtime,
  };
}

export async function runJob16(): Promise<string> {
  const now = new Date();
  const logger = new JobLogger();

  const today = getDateKey(now);
  const targetPrefix = `${CONFIG.targetPrefix}${today}`;

  const dir = selectDirectoryByTime(
    now,
    CONFIG.normalErrorPath,
    CONFIG.farmersErrorPath,
    CONFIG.cutoffHour,
    CONFIG.cutoffMinute,
  );

  logger.log(`対象ディレクトリ : ${dir}`);
  logger.log(`検索パターン : ${targetPrefix}*${CONFIG.extension}`);

  if (!(await directoryExists(dir))) {
    throw logger.fail(`ディレクトリが存在しません: ${dir}`);
  }

  const targetFiles = await findFiles(dir, {
    prefix: targetPrefix,
    suffix: CONFIG.extension,
  });

  if (targetFiles.length === 0) {
    logger.log("検出結果 : エラーファイルなし");
    return logger.complete();
  }

  logger.log("エラーファイルを検出しました");
  logger.log(`検出件数 : ${targetFiles.length}件`);

  const fileInfos = await Promise.all(
    targetFiles.map((filePath) => getFileInfo(filePath)),
  );

  for (const fileInfo of fileInfos) {
    logger.log(`ファイル名 : ${fileInfo.fileName}`);
    logger.log(`更新日時 : ${format(fileInfo.mtime, "yyyy/MM/dd HH:mm:ss")}`);
  }

  throw logger.fail(
    `SANSANエラーファイルを検出しました (${targetFiles.length}件)`,
  );
}
