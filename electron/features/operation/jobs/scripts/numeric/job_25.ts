// electron/features/operation/jobs/scripts/numeric/job_25.ts

import fs from "fs-extra";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  keywords: ["htsf0060", "Okurikomi"],
  expectedFilesPerKeyword: 1,
} as const;

type KeywordResult = {
  keyword: string;
  fileNames: string[];
};

type JobResult = {
  targetDir: string;
  results: KeywordResult[];
  missingFiles: KeywordResult[];
};

/**
 * 当日分の対象ファイルを確認する。
 *
 * 正常終了条件:
 * - htsf0060 が1件
 * - Okurikomi が1件
 *
 * 業務上の要対応:
 * - いずれかの対象ファイルが1件以外
 *
 * システムエラー:
 * - 対象ディレクトリへのアクセス失敗
 */
export async function runJob25(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await findTargetFiles();
    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(
      `ディレクトリにアクセスできません: ${CONFIG.targetDir}${detail}`,
    );
  }
}

/**
 * 当日分の対象ファイルを検索し、キーワードごとに分類する。
 */
async function findTargetFiles(): Promise<JobResult> {
  const today = format(new Date(), "yyyyMMdd");

  const entries = await fs.readdir(CONFIG.targetDir, {
    withFileTypes: true,
  });

  const todayFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.includes(today),
  );

  const results: KeywordResult[] = CONFIG.keywords.map((keyword) => ({
    keyword,
    fileNames: todayFiles
      .filter((entry) => entry.name.includes(keyword))
      .map((entry) => entry.name),
  }));

  const missingFiles = results.filter(
    (result) => result.fileNames.length !== CONFIG.expectedFilesPerKeyword,
  );

  return {
    targetDir: CONFIG.targetDir,
    results,
    missingFiles,
  };
}

/**
 * 検索結果と不足ファイルをログに出力する。
 */
function writeResultLog(logger: JobLogger, result: JobResult): string {
  logger.log(`対象ディレクトリ : ${result.targetDir}`);

  logger.section("検索結果");

  for (const item of result.results) {
    for (const fileName of item.fileNames) {
      logger.log(fileName);
    }
  }

  if (result.missingFiles.length > 0) {
    logger.section("不足ファイル");

    for (const item of result.missingFiles) {
      logger.log(
        `${item.keyword}: ${
          item.fileNames.length > 0
            ? item.fileNames.join(", ")
            : "該当ファイルなし"
        }`,
      );
    }

    return logger.needsAction("ファイル確認要対応");
  }

  return logger.complete();
}
