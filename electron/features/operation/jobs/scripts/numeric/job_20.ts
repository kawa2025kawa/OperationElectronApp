// electron/features/operation/jobs/scripts/numeric/job_20.ts

import fs from "fs-extra";
import path from "node:path";
import { addDays, format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\AUTOORD\\RCV\\SV",
  targetFileKeyword: "JIDOHAT",
  maxDiffKb: 10000,
} as const;

// timeUtils の getDateKey をローカル実装
function getDateKey(date: Date, dateFormat = "yyyyMMdd"): string {
  return format(date, dateFormat);
}

// timeUtils の getDateKeyOffset をローカル実装
function getDateKeyOffset(
  offsetDays: number,
  baseDate: Date,
  dateFormat = "yyyyMMdd",
): string {
  return format(addDays(baseDate, -offsetDays), dateFormat);
}

// folderUtils の directoryExists をローカル実装
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    return (await fs.stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

// fileUtils の findFiles をローカル実装
async function findFiles(
  dirPath: string,
  options: { includes?: string[] },
): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const includes = options.includes ?? [];

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        includes.every((keyword) => entry.name.includes(keyword)),
    )
    .map((entry) => path.join(dirPath, entry.name));
}

// fileUtils の getFileInfo をローカル実装
async function getFileInfo(filePath: string): Promise<{
  fileName: string;
  sizeKb: number;
  mtime: Date;
}> {
  const stats = await fs.stat(filePath);

  return {
    fileName: path.basename(filePath),
    sizeKb: stats.size / 1024,
    mtime: stats.mtime,
  };
}

export async function runJob20(): Promise<string> {
  const now = new Date();
  const today = getDateKey(now, "yyMMdd");
  const lastWeek = getDateKeyOffset(7, now, "yyMMdd");
  const logger = new JobLogger();

  logger.log(`対象ディレクトリ : ${CONFIG.targetDir}`);

  if (!(await directoryExists(CONFIG.targetDir))) {
    throw logger.fail(`対象ディレクトリが存在しません: ${CONFIG.targetDir}`);
  }

  try {
    const todayFiles = await findFiles(CONFIG.targetDir, {
      includes: [CONFIG.targetFileKeyword, today],
    });

    if (todayFiles.length === 0) {
      throw new Error(`対象ファイルが見つかりません (日付キー: ${today})`);
    }

    const todayFile = await getFileInfo(todayFiles[0]);

    logger.log(`本日分 : ${todayFile.fileName}`);
    logger.log(`サイズ : ${todayFile.sizeKb.toFixed(2)} KB`);

    const lastWeekFiles = await findFiles(CONFIG.targetDir, {
      includes: [CONFIG.targetFileKeyword, lastWeek],
    });

    if (lastWeekFiles.length === 0) {
      throw new Error(`対象ファイルが見つかりません (日付キー: ${lastWeek})`);
    }

    const lastWeekFile = await getFileInfo(lastWeekFiles[0]);

    logger.log(`先週分  : ${lastWeekFile.fileName}`);
    logger.log(`サイズ : ${lastWeekFile.sizeKb.toFixed(2)} KB`);

    const diffKb = Math.abs(todayFile.sizeKb - lastWeekFile.sizeKb);
    const formattedDiff = diffKb.toFixed(2);
    const formattedLimit = CONFIG.maxDiffKb.toFixed(0);

    logger.log(`サイズ差分 : ${formattedDiff} KB`);
    logger.log(`許容閾値 : ${formattedLimit} KB`);

    if (diffKb > CONFIG.maxDiffKb) {
      throw new Error(
        `ファイルサイズの差分が閾値を超えています (差分: ${formattedDiff} KB, 許容値: ${formattedLimit} KB)`,
      );
    }

    logger.log("判定結果 : 正常 (閾値内)");

    return logger.complete();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}
