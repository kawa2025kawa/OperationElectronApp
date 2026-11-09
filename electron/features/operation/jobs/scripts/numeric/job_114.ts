// electron/features/operation/jobs/scripts/numeric/job_114.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  logDir: "\\\\192.88.100.1\\diskD\\execute\\log",
  fileSuffix: "ORJH0010.log",
  keyword: "READ=",
  encoding: "Shift_JIS",
} as const;

interface LogFileInfo {
  fileName: string;
  filePath: string;
  modifiedAt: Date;
}

interface ReadCountResult {
  rawCount: string;
  formattedCount: string;
}

type JobResultData = {
  datePrefix: string;
  fileInfo: LogFileInfo | null;
  countResult: ReadCountResult | null;
  businessErrorMessage?: string;
};

export async function runJob114(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await processLogFile();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw logger.fail(`ログ処理に失敗しました${detail}`);
  }
}

function getDatePrefix(date = new Date()): string {
  return format(date, "yyMMdd");
}

function formatModifiedTime(date: Date): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

/**
 * ログフォルダの存在・アクセス可否を確認（システムエラー検知用）
 */
async function validateLogDirectory(): Promise<void> {
  const stats = await fs.stat(CONFIG.logDir);
  if (!stats.isDirectory()) {
    throw new Error(`フォルダではありません: ${CONFIG.logDir}`);
  }
}

/**
 * ログファイルの検索・情報取得・件数解析を実行する。
 */
async function processLogFile(): Promise<JobResultData> {
  await validateLogDirectory();

  const datePrefix = getDatePrefix();
  const entries = await fs.readdir(CONFIG.logDir);

  const targetFileName = entries.find(
    (fileName) =>
      fileName.startsWith(datePrefix) && fileName.includes(CONFIG.fileSuffix),
  );

  // 業務エラー: 当日分ファイルが存在しない
  if (!targetFileName) {
    return {
      datePrefix,
      fileInfo: null,
      countResult: null,
      businessErrorMessage: `対象ファイルなし (${datePrefix}*_${CONFIG.fileSuffix})`,
    };
  }

  const filePath = path.join(CONFIG.logDir, targetFileName);
  const stats = await fs.stat(filePath);
  const fileInfo: LogFileInfo = {
    fileName: targetFileName,
    filePath,
    modifiedAt: stats.mtime,
  };

  // ファイル解析
  const buffer = await fs.readFile(filePath);
  const text = iconv.decode(buffer, CONFIG.encoding);
  const match = text.match(/READ=([^\s\r\n,]+)/);

  // 業務エラー: ログはあるが必須キーワードが存在しない
  if (!match?.[1]) {
    return {
      datePrefix,
      fileInfo,
      countResult: null,
      businessErrorMessage: `必須キーワード "${CONFIG.keyword}" なし`,
    };
  }

  const rawCount = match[1];
  const count = Number.parseInt(rawCount, 10);
  const countResult: ReadCountResult = {
    rawCount,
    formattedCount: Number.isNaN(count)
      ? `${rawCount}件`
      : `${count.toLocaleString()}件`,
  };

  return {
    datePrefix,
    fileInfo,
    countResult,
  };
}

/**
 * 結果に応じてログを出力し、ステータスを確定する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.log(`ファイルパス : ${CONFIG.logDir}`);

  // 業務内エラー（ファイルなし、またはキーワードなし）
  if (result.businessErrorMessage) {
    logger.log(result.businessErrorMessage);
    return logger.needsAction(result.businessErrorMessage);
  }

  // 正常取得時
  if (result.fileInfo && result.countResult) {
    logger.section("検出ファイル");
    logger.log(result.fileInfo.fileName);

    logger.section("ファイル更新日時");
    logger.log(formatModifiedTime(result.fileInfo.modifiedAt));

    logger.section("READ件数");
    logger.log(result.countResult.formattedCount);

    return logger.complete();
  }

  return logger.needsAction("想定外の状態です");
}
