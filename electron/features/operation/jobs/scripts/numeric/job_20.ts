/**
 * electron/features/operation/jobs/scripts/numeric/job_20.ts
 */

import fs from "fs-extra";
import path from "node:path";
import { addDays, format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\AUTOORD\\RCV\\SV",
  targetFileKeyword: "JIDOHAT",
  maxDiffKb: 10000,
  comparisonDays: 7,
} as const;

type FileInfo = {
  fileName: string;
  sizeKb: number;
  mtime: Date;
};

type JobResult = {
  targetDir: string;
  todayKey: string;
  lastWeekKey: string;
  todayFile: FileInfo | null;
  lastWeekFile: FileInfo | null;
  diffKb: number | null;
  needsAction: boolean;
  message: string | null;
};

/**
 * 本日分と先週分の対象ファイルを比較する。
 *
 * 正常終了条件:
 * - 本日分と先週分の対象ファイルが存在する
 * - ファイルサイズの差分が許容閾値以内
 *
 * 業務上の要対応:
 * - 本日分または先週分の対象ファイルが存在しない
 * - ファイルサイズの差分が許容閾値を超えている
 *
 * システムエラー:
 * - 対象ディレクトリへのアクセス失敗
 * - ファイル情報の取得失敗
 */
export async function runJob20(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await findTargetFiles();
    return writeResultLog(logger, result);
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? ` (${error.message})` : ` (${String(error)})`;

    throw logger.fail(
      `対象ファイルの確認中にシステムエラーが発生しました: ${CONFIG.targetDir}${detail}`,
    );
  }
}

/**
 * 指定日付キーに一致する対象ファイルを1件取得する。
 */
async function findTargetFile(dateKey: string): Promise<string | null> {
  const entries = await fs.readdir(CONFIG.targetDir, {
    withFileTypes: true,
  });

  const targetFile = entries.find(
    (entry) =>
      entry.isFile() &&
      entry.name.includes(CONFIG.targetFileKeyword) &&
      entry.name.includes(dateKey),
  );

  return targetFile ? path.join(CONFIG.targetDir, targetFile.name) : null;
}

/**
 * ファイル情報を取得する。
 */
async function getFileInfo(filePath: string): Promise<FileInfo> {
  const stats = await fs.stat(filePath);

  return {
    fileName: path.basename(filePath),
    sizeKb: stats.size / 1024,
    mtime: stats.mtime,
  };
}

/**
 * 本日分と先週分のファイルを取得し、サイズ差分を判定する。
 *
 * ファイルが見つからない場合は業務上の判定結果として返す。
 * ファイルシステムの例外は呼び出し元へ伝播する。
 */
async function findTargetFiles(): Promise<JobResult> {
  const now = new Date();
  const todayKey = format(now, "yyMMdd");
  const lastWeekKey = format(addDays(now, -CONFIG.comparisonDays), "yyMMdd");

  const todayPath = await findTargetFile(todayKey);

  if (todayPath === null) {
    return {
      targetDir: CONFIG.targetDir,
      todayKey,
      lastWeekKey,
      todayFile: null,
      lastWeekFile: null,
      diffKb: null,
      needsAction: true,
      message: `本日分の対象ファイルが見つかりません (日付キー: ${todayKey})`,
    };
  }

  const todayFile = await getFileInfo(todayPath);

  const lastWeekPath = await findTargetFile(lastWeekKey);

  if (lastWeekPath === null) {
    return {
      targetDir: CONFIG.targetDir,
      todayKey,
      lastWeekKey,
      todayFile,
      lastWeekFile: null,
      diffKb: null,
      needsAction: true,
      message: `先週分の対象ファイルが見つかりません (日付キー: ${lastWeekKey})`,
    };
  }

  const lastWeekFile = await getFileInfo(lastWeekPath);
  const diffKb = Math.abs(todayFile.sizeKb - lastWeekFile.sizeKb);

  if (diffKb > CONFIG.maxDiffKb) {
    return {
      targetDir: CONFIG.targetDir,
      todayKey,
      lastWeekKey,
      todayFile,
      lastWeekFile,
      diffKb,
      needsAction: true,
      message: `ファイルサイズの差分が閾値を超えています (差分: ${diffKb.toFixed(2)} KB, 許容値: ${CONFIG.maxDiffKb} KB)`,
    };
  }

  return {
    targetDir: CONFIG.targetDir,
    todayKey,
    lastWeekKey,
    todayFile,
    lastWeekFile,
    diffKb,
    needsAction: false,
    message: null,
  };
}

/**
 * 検索結果とサイズ比較結果をログに出力する。
 */
function writeResultLog(logger: JobLogger, result: JobResult): string {
  logger.log(`対象フォルダ : ${result.targetDir}`);

  logger.section("ファイル確認結果");

  if (result.todayFile !== null) {
    logger.log(`本日分 : ${result.todayFile.fileName}`);
    logger.log(`サイズ : ${result.todayFile.sizeKb.toFixed(2)} KB`);
  }

  if (result.lastWeekFile !== null) {
    logger.log(`先週分 : ${result.lastWeekFile.fileName}`);
    logger.log(`サイズ : ${result.lastWeekFile.sizeKb.toFixed(2)} KB`);
  }

  if (result.diffKb !== null) {
    logger.log(`サイズ差分 : ${result.diffKb.toFixed(2)} KB`);
    logger.log(`許容閾値 : ${CONFIG.maxDiffKb.toFixed(0)} KB`);
  }

  if (result.needsAction) {
    return logger.needsAction(result.message ?? "対象ファイルの確認が必要です");
  }

  logger.log("判定結果 : 正常 (閾値内)");

  return logger.complete();
}
