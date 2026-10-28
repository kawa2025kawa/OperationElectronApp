// electron/features/operation/jobs/scripts/numeric/job_62.ts

import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

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

  try {
    const entries = await fs.readdir(CONFIG.targetDir, {
      withFileTypes: true,
    });
    const fileNames = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    const errors: string[] = [];

    for (const { keyword, count } of CONFIG.expectedFiles) {
      const matchedFiles = fileNames.filter((fileName) =>
        fileName.includes(keyword),
      );

      matchedFiles.forEach((fileName) => logger.log(fileName));

      if (matchedFiles.length !== count) {
        errors.push(
          `${keyword} (期待: ${count}, 検出: ${matchedFiles.length})`,
        );
      }
    }

    if (errors.length > 0) {
      return logger.needsAction(`ファイル件数不一致:\n${errors.join("\n")}`);
    }

    return logger.complete();
  } catch (error) {
    throw logger.fail(
      `システムエラーが発生しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
