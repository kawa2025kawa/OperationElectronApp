// electron/features/operation/jobs/scripts/numeric/job_62.ts

import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";

import {
  findFiles,
  getFileInfo,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV",
  expectedFiles: [
    { keyword: "htsf0060", count: 1 },
    { keyword: "Syohin_toMD_N", count: 4 },
    { keyword: "Tokusyo_toMD_N", count: 4 },
  ],
} as const;

export async function runJob62(): Promise<string> {
  const logger = new JobLogger();

  logger.log(`監視ディレクトリ : ${CONFIG.targetDir}`);

  if (!(await directoryExists(CONFIG.targetDir))) {
    throw logger.fail(`ディレクトリが存在しません: ${CONFIG.targetDir}`);
  }

  const errorDetails: string[] = [];

  for (const rule of CONFIG.expectedFiles) {
    const matchedFiles = await findFiles(CONFIG.targetDir, {
      includes: [rule.keyword],
    });

    const isMatched = matchedFiles.length === rule.count;

    if (isMatched) {
      logger.log(
        `  [${rule.keyword}] 検出 : ${matchedFiles.length} / 期待 : ${rule.count}`,
      );

      const fileInfos = await Promise.all(
        matchedFiles.map((filePath) => getFileInfo(filePath)),
      );

      for (const info of fileInfos) {
        logger.log(`    ${info.fileName}`);
        logger.log(
          `    更新日時 : ${format(info.mtime, "yyyy/MM/dd HH:mm:ss")}`,
        );
      }
    } else {
      errorDetails.push(
        `${rule.keyword} (期待: ${rule.count}, 検出: ${matchedFiles.length})`,
      );

      logger.log(
        `  [${rule.keyword}] 不一致 (期待: ${rule.count} / 検出: ${matchedFiles.length})`,
      );
    }

    logger.section();
  }

  if (errorDetails.length > 0) {
    throw logger.fail(`ファイル件数不一致:\n${errorDetails.join("\n")}`);
  }

  return logger.complete("全期待ファイル確認済");
}
