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

type FileMatchResult = {
  keyword: string;
  expectedCount: number;
  actualCount: number;
  fileNames: string[];
};

type JobResultData = {
  targetDir: string;
  results: FileMatchResult[];
  errors: string[];
};

/**
 * 指定ディレクトリ内のキーワード別ファイル件数が想定通りであるかを確認する。
 *
 * 業務上の要対応:
 * - 各キーワードのファイル件数が一致しない場合
 *
 * システムエラー:
 * - 対象ディレクトリへのアクセス失敗
 */
export async function runJob62(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await checkExpectedFiles();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw logger.fail(`ファイル処理に失敗しました${detail}`);
  }
}

/**
 * ディレクトリを走査し、期待されるファイル件数との突合を行う。
 */
async function checkExpectedFiles(): Promise<JobResultData> {
  const entries = await fs.readdir(CONFIG.targetDir, {
    withFileTypes: true,
  });

  const fileNames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  const errors: string[] = [];
  const results: FileMatchResult[] = [];

  for (const { keyword, count } of CONFIG.expectedFiles) {
    const matchedFiles = fileNames.filter((fileName) =>
      fileName.includes(keyword),
    );

    results.push({
      keyword,
      expectedCount: count,
      actualCount: matchedFiles.length,
      fileNames: matchedFiles,
    });

    if (matchedFiles.length !== count) {
      errors.push(`${keyword} (期待: ${count}, 検出: ${matchedFiles.length})`);
    }
  }

  return {
    targetDir: CONFIG.targetDir,
    results,
    errors,
  };
}

/**
 * 突合結果をログに出力し、ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.log(`監視ディレクトリ : ${result.targetDir}`);

  logger.section("検出ファイル");
  for (const item of result.results) {
    for (const fileName of item.fileNames) {
      logger.log(fileName);
    }
  }

  if (result.errors.length > 0) {
    return logger.needsAction(
      `ファイル件数不一致:\n${result.errors.join("\n")}`,
    );
  }

  return logger.complete();
}
