//electron\features\operation\jobs\scripts\numeric\job_25.ts

import fs from "fs-extra";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  keywords: ["htsf0060", "Okurikomi"],
  maxFilesPerKeyword: 1,
} as const;

export async function runJob25(): Promise<string> {
  const logger = new JobLogger();
  const today = format(new Date(), "yyyyMMdd");

  logger.log(`対象ディレクトリ : ${CONFIG.targetDir}`);
  logger.log(`対象日付 : ${today}`);

  let entries;

  try {
    entries = await fs.readdir(CONFIG.targetDir, {
      withFileTypes: true,
    });
  } catch {
    throw logger.fail(`ディレクトリにアクセスできません: ${CONFIG.targetDir}`);
  }

  const todayFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.includes(today),
  );

  const errors: string[] = [];

  for (const keyword of CONFIG.keywords) {
    const matches = todayFiles.filter((entry) => entry.name.includes(keyword));

    if (matches.length === 0) {
      errors.push(`${keyword}: 対象ファイルなし`);
      logger.log(`対象なし [${keyword}]`);
      continue;
    }

    if (matches.length > CONFIG.maxFilesPerKeyword) {
      errors.push(
        `${keyword}: 上限超過 (${matches.length}件 / 上限${CONFIG.maxFilesPerKeyword}件)`,
      );
      logger.log(`対象複数 [${keyword}] ${matches.length}件`);

      for (const entry of matches) {
        logger.log(`  ${entry.name}`);
      }

      continue;
    }

    logger.log(`対象あり [${keyword}] ${matches[0].name}`);
  }

  if (errors.length > 0) {
    throw logger.fail(`ファイル確認エラー: ${errors.join(" / ")}`);
  }

  return logger.complete();
}
