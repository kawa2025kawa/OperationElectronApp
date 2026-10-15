// electron/features/operation/jobs/scripts/numeric/job_25.ts

import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";

import {
  findFiles,
  getLatestFile,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";

import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  keywords: ["htsf0060", "Okurikomi"],
} as const;

export async function runJob25(): Promise<string> {
  const today = getDateKey(new Date());
  const logger = new JobLogger();

  logger.log(`対象ディレクトリ : ${CONFIG.targetDir}`);
  logger.log(`検索日付 : ${today}`);

  if (!(await directoryExists(CONFIG.targetDir))) {
    throw logger.fail(`ディレクトリが存在しません: ${CONFIG.targetDir}`);
  }

  const todayFiles = await findFiles(CONFIG.targetDir, {
    dateKey: today,
  });

  const missingKeywords: string[] = [];

  for (const keyword of CONFIG.keywords) {
    const matchedFiles = await findFiles(CONFIG.targetDir, {
      dateKey: today,
      includes: [keyword],
    });

    if (matchedFiles.length === 0) {
      missingKeywords.push(keyword);
      logger.log(`対象なし [${keyword}]`);
      continue;
    }

    const latest = await getLatestFile(matchedFiles);

    if (!latest) {
      missingKeywords.push(keyword);
      logger.log(`対象なし [${keyword}]`);
      continue;
    }

    logger.log(`検出 [${keyword}] : ${latest.fileName}`);
  }

  if (missingKeywords.length > 0) {
    throw logger.fail(
      `未受信ファイルあり (対象: ${missingKeywords.join(", ")})`,
    );
  }

  return logger.complete("全ファイル受信確認");
}
