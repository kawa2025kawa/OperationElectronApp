// electron/features/operation/jobs/scripts/numeric/job_25.ts

import fs from "fs-extra";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  keywords: ["htsf0060", "Okurikomi"],
  minFilesPerKeyword: 1,
  maxFilesPerKeyword: 2,
} as const;

type KeywordResult = {
  keyword: string;
  fileNames: string[];
};

type Job25CheckResult = {
  targetDir: string;
  results: KeywordResult[];
  missingKeywords: KeywordResult[];
  excessKeywords: KeywordResult[];
};

/**
 * 当日分の対象ファイルを確認する。
 *
 * 監視継続 (running):
 * - いずれかの対象ファイルが未検出（0件）の場合（バックグラウンドでポーリング監視）
 *
 * 業務上の要対応 (needsAction):
 * - いずれかの対象ファイルが上限（2件：朝・昼の2回分）を超過している場合
 *
 * 正常終了 (success):
 * - htsf0060 が1〜2件
 * - Okurikomi が1〜2件
 *
 * システムエラー:
 * - 対象フォルダへのアクセス失敗
 */
export async function runJob25(): Promise<JobResult> {
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
      `フォルダにアクセスできません: ${CONFIG.targetDir}${detail}`,
    );
  }
}

/**
 * 当日分の対象ファイルを検索し、キーワードごとに分類する。
 */
async function findTargetFiles(): Promise<Job25CheckResult> {
  const today = format(new Date(), "yyyyMMdd");

  const entries = await fs.readdir(CONFIG.targetDir, {
    withFileTypes: true,
  });

  const todayFiles = entries
    .filter((entry) => entry.isFile() && entry.name.includes(today))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const results: KeywordResult[] = CONFIG.keywords.map((keyword) => ({
    keyword,
    fileNames: todayFiles.filter((fileName) => fileName.includes(keyword)),
  }));

  const missingKeywords = results.filter(
    (result) => result.fileNames.length < CONFIG.minFilesPerKeyword,
  );

  const excessKeywords = results.filter(
    (result) => result.fileNames.length > CONFIG.maxFilesPerKeyword,
  );

  return {
    targetDir: CONFIG.targetDir,
    results,
    missingKeywords,
    excessKeywords,
  };
}

/**
 * 検索結果と不足・超過ファイルをログに出力し、JobResult を返却する。
 */
function writeResultLog(
  logger: JobLogger,
  result: Job25CheckResult,
): JobResult {
  logger.log(`対象フォルダ : ${result.targetDir}`);

  logger.section("検索結果");

  for (const item of result.results) {
    for (const fileName of item.fileNames) {
      logger.log(fileName);
    }
  }

  if (result.excessKeywords.length > 0) {
    logger.section("ファイル件数超過");

    for (const item of result.excessKeywords) {
      logger.log(
        `${item.keyword} (${item.fileNames.length}件 / 上限${CONFIG.maxFilesPerKeyword}件): ${item.fileNames.join(", ")}`,
      );
    }

    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction("対象ファイルが上限件数を超えています"),
      data: result,
    };
  }

  if (result.missingKeywords.length > 0) {
    logger.section("不足ファイル");

    for (const item of result.missingKeywords) {
      logger.log(`${item.keyword}: 該当ファイルなし（配置待ち）`);
    }

    const missingNames = result.missingKeywords.map((item) => item.keyword);

    return {
      success: true,
      kind: "running",
      message: logger.complete(
        `ファイル未検出 (対象: ${missingNames.join(", ")})。バックグラウンドで監視中`,
      ),
      data: result,
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete(),
    data: result,
  };
}
