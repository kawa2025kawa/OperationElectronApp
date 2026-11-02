// electron/features/operation/jobs/scripts/eseries/job_e1.ts

import path from "node:path";
import fs from "fs-extra";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\mdsyuhai01.BELC01.belc.local\\IF\\EOB棚割\\SND",
  keywords: ["EOB_DSP_001"],
} as const;

type MatchedFile = {
  keyword: string;
  fileName: string;
};

type JobResultData = {
  matchedFiles: MatchedFile[];
  missingKeywords: string[];
};

/**
 * 当日分の EOB棚割ファイルを受信しているか確認する。
 *
 * 確認先:
 * - SND ディレクトリ
 *
 * 業務上の要対応:
 * - 本日更新された対象ファイルが存在しない（未受信）場合
 *
 * システムエラー:
 * - ディレクトリへのアクセス失敗
 * - ファイルステータス取得失敗
 */
export async function runJobE1(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await checkTargetFiles();

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
 * 対象ディレクトリからキーワードに一致する本日更新ファイルを検索・確認する。
 */
async function checkTargetFiles(): Promise<JobResultData> {
  const today = format(new Date(), "yyyy-MM-dd");
  const entries = await fs.readdir(CONFIG.targetDir, {
    withFileTypes: true,
  });

  const matchedFiles: MatchedFile[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of CONFIG.keywords) {
    const matchedFile = await findTodayFile(entries, keyword, today);

    if (matchedFile) {
      matchedFiles.push({ keyword, fileName: matchedFile });
    } else {
      missingKeywords.push(keyword);
    }
  }

  return {
    matchedFiles,
    missingKeywords,
  };
}

/**
 * 指定キーワードを含み、更新日が当日であるファイルを探索する。
 */
async function findTodayFile(
  entries: fs.Dirent[],
  keyword: string,
  today: string,
): Promise<string | null> {
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.includes(keyword)) {
      continue;
    }

    const { mtime } = await fs.stat(path.join(CONFIG.targetDir, entry.name));

    if (format(mtime, "yyyy-MM-dd") === today) {
      return entry.name;
    }
  }

  return null;
}

/**
 * 検索結果をログに出力し、最終ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.section("対象フォルダ");
  logger.log(CONFIG.targetDir);

  if (result.matchedFiles.length > 0) {
    logger.section("検出ファイル");
    for (const { keyword, fileName } of result.matchedFiles) {
      logger.log(`[${keyword}] ${fileName}`);
    }
  }

  if (result.missingKeywords.length > 0) {
    logger.section("未受信ファイル");
    for (const keyword of result.missingKeywords) {
      logger.log(`[${keyword}] 本日更新されたファイルなし`);
    }

    return logger.needsAction(
      `未受信ファイルあり (対象: ${result.missingKeywords.join(", ")})`,
    );
  }

  return logger.complete();
}
