// electron/features/operation/jobs/scripts/numeric/job_25.ts

import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  getDateKey,
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  host: NETWORK_HOSTS.MDSYUHAI01,
  subPaths: ["if", "MASTER", "RCV", "SV"] as const,
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
 */
export async function runJob25(): Promise<JobResult> {
  const targetDir = getNetworkHostPath(CONFIG.host, ...CONFIG.subPaths);
  return runJobWithLogger(
    `フォルダにアクセスできません: ${targetDir}`,
    async (logger) => {
      const result = await findTargetFiles(targetDir);
      return writeResultLog(logger, result);
    },
  );
}

async function findTargetFiles(targetDir: string): Promise<Job25CheckResult> {
  const today = getDateKey();
  const fileNames = await withNetworkAuthRetry(targetDir, () =>
    listFilesInDir(targetDir),
  );

  const todayFiles = fileNames
    .filter((name) => name.includes(today))
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
    targetDir,
    results,
    missingKeywords,
    excessKeywords,
  };
}

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