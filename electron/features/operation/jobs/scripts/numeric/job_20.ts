// electron/features/operation/jobs/scripts/numeric/job_20.ts

import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";

import {
  findFiles,
  getFileInfo,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";

import {
  getDateKey,
  getDateKeyOffset,
} from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\AUTOORD\\RCV\\SV",
  targetFileKeyword: "JIDOHAT",
  maxDiffKb: 10000,
} as const;

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

    logger.log(`本日分 (${today}) ファイル : ${todayFile.fileName}`);
    logger.log(`サイズ : ${todayFile.sizeKb.toFixed(2)} KB`);
    logger.log(`更新日時 : ${format(todayFile.mtime, "yyyy/MM/dd HH:mm:ss")}`);

    const lastWeekFiles = await findFiles(CONFIG.targetDir, {
      includes: [CONFIG.targetFileKeyword, lastWeek],
    });

    if (lastWeekFiles.length === 0) {
      throw new Error(`対象ファイルが見つかりません (日付キー: ${lastWeek})`);
    }

    const lastWeekFile = await getFileInfo(lastWeekFiles[0]);

    logger.log(`先週分 (${lastWeek}) ファイル : ${lastWeekFile.fileName}`);
    logger.log(`サイズ : ${lastWeekFile.sizeKb.toFixed(2)} KB`);
    logger.log(
      `更新日時 : ${format(lastWeekFile.mtime, "yyyy/MM/dd HH:mm:ss")}`,
    );

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

    return logger.complete(`差分 ${formattedDiff} KB (閾値内)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}
