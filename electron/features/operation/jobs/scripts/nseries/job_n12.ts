// electron/features/operation/jobs/scripts/nseries/job_n12.ts

import path from "node:path";
import fs from "fs-extra";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { getStatus } from "@electron/features/operation/application/statusManager";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

const TARGET_KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

export type JobN12Keyword = (typeof TARGET_KEYWORDS)[number];

const CONFIG = {
  targetDirSv: "\\\\172.25.101.51\\if\\WMSSLIP\\RCV\\SV",
  targetDirRcv: "\\\\172.25.101.51\\if\\WMSSLIP\\RCV",
  refKanriNo: "49",
  keywords: TARGET_KEYWORDS,
} as const;

type MatchedFile = {
  keyword: string;
  fileName: string;
  mtime: number;
};

type JobResultData = {
  targetDir: string;
  matchedFiles: MatchedFile[];
  missingKeywords: string[];
};

/**
 * 管理番号49のステータスに応じた受信ディレクトリから、対象キーワードを含む最新ファイルの存在を確認する。
 *
 * 確認先:
 * - 管理番号49が READY / WAITING: \\172.25.101.51\if\WMSSLIP\RCV
 * - それ以外: \\172.25.101.51\if\WMSSLIP\RCV\SV
 *
 * 業務上の要対応:
 * - 対象キーワードのファイルが存在しない（未検出）場合
 *
 * システムエラー:
 * - ディレクトリへのアクセス失敗
 * - ファイル情報取得失敗
 */
export async function runJobN12(): Promise<string> {
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
 * 管理番号49のステータスを基に対象ディレクトリを決定する。
 */
function resolveTargetDir(): string {
  const status = getStatus(CONFIG.refKanriNo)?.status;

  console.log("[job_n12] DSI8020 status", {
    kanriNo: CONFIG.refKanriNo,
    status,
  });

  return status === JOB_STATUS.READY || status === JOB_STATUS.WAITING
    ? CONFIG.targetDirRcv
    : CONFIG.targetDirSv;
}

/**
 * 対象ディレクトリから指定キーワードを含む最新ファイルを探索する。
 */
async function findLatestFile(
  directory: string,
  files: string[],
  keyword: string,
): Promise<MatchedFile | null> {
  let latest: MatchedFile | null = null;

  for (const fileName of files) {
    if (!fileName.includes(keyword)) {
      continue;
    }

    const fileStat = await fs.stat(path.join(directory, fileName));

    if (fileStat.isFile() && (!latest || fileStat.mtimeMs > latest.mtime)) {
      latest = {
        keyword,
        fileName,
        mtime: fileStat.mtimeMs,
      };
    }
  }

  return latest;
}

/**
 * 対象ディレクトリを走査し、キーワードごとのファイル存在を検証する。
 */
async function checkTargetFiles(): Promise<JobResultData> {
  const targetDir = resolveTargetDir();

  if (!(await fs.pathExists(targetDir))) {
    throw new Error(`ディレクトリが存在しません: ${targetDir}`);
  }

  const files = await fs.readdir(targetDir);
  const matchedFiles: MatchedFile[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of CONFIG.keywords) {
    const latest = await findLatestFile(targetDir, files, keyword);

    if (latest) {
      matchedFiles.push(latest);
    } else {
      missingKeywords.push(keyword);
    }
  }

  return {
    targetDir,
    matchedFiles,
    missingKeywords,
  };
}

/**
 * 検索結果をログに出力し、最終ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.section("確認対象フォルダ");
  logger.log(result.targetDir);

  if (result.matchedFiles.length > 0) {
    logger.section("検出ファイル");
    for (const file of result.matchedFiles) {
      logger.log(`[${file.keyword}] ${file.fileName}`);
    }
  }

  if (result.missingKeywords.length > 0) {
    logger.section("未検出ファイル");
    for (const keyword of result.missingKeywords) {
      logger.log(`[${keyword}] ファイルが見つかりません`);
    }

    return logger.needsAction(
      `未検出ファイルあり (対象: ${result.missingKeywords.join(", ")})`,
    );
  }

  return logger.complete();
}
