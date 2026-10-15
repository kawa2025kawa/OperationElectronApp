// electron/features/operation/jobs/scripts/numeric/job_16.ts

import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  directoryExists,
  selectDirectoryByTime,
} from "@electron/features/operation/jobs/scripts/helpers/folderUtils";
import {
  findFiles,
  getFileInfo,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";
import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";
const CONFIG = {
  normalErrorPath: "\\\\192.88.1.3\\syn_tran",
  farmersErrorPath: "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー",
  targetPrefix: "SANSAN_ERROR_",
  extension: ".txt",
  cutoffHour: 8,
  cutoffMinute: 30,
} as const;

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
    return logger.complete("エラーファイルなし (正常)");
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
