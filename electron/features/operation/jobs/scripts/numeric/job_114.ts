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

function getDatePrefix(date = new Date()): string {
  return format(date, "yyMMdd");
}

function formatModifiedTime(date: Date): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

async function validateLogDirectory(): Promise<void> {
  try {
    if ((await fs.stat(CONFIG.logDir)).isDirectory()) {
      return;
    }

    throw new Error(`ディレクトリではありません: ${CONFIG.logDir}`);
  } catch (error: unknown) {
    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw new Error(`ログにアクセスできません: ${CONFIG.logDir}${detail}`, {
      cause: error,
    });
  }
}

async function findLogFile(datePrefix: string): Promise<string | undefined> {
  const entries = await fs.readdir(CONFIG.logDir);

  return entries.find(
    (fileName) =>
      fileName.startsWith(datePrefix) && fileName.includes(CONFIG.fileSuffix),
  );
}

async function getLogFileInfo(fileName: string): Promise<LogFileInfo> {
  const filePath = path.join(CONFIG.logDir, fileName);
  const stats = await fs.stat(filePath);

  return {
    fileName,
    filePath,
    modifiedAt: stats.mtime,
  };
}

async function readCount(filePath: string): Promise<ReadCountResult> {
  const buffer = await fs.readFile(filePath);
  const text = iconv.decode(buffer, CONFIG.encoding);
  const match = text.match(/READ=([^\s\r\n,]+)/);

  if (!match?.[1]) {
    throw new Error(`キーワード '${CONFIG.keyword}' がログ内に見つかりません`);
  }

  const rawCount = match[1];
  const count = Number.parseInt(rawCount, 10);

  return {
    rawCount,
    formattedCount: Number.isNaN(count)
      ? `${rawCount}件`
      : `${count.toLocaleString()}件`,
  };
}

function writeResultLog(
  logger: JobLogger,
  fileInfo: LogFileInfo,
  countResult: ReadCountResult,
): string {
  logger.log(`検出ファイル : ${fileInfo.fileName}`);
  logger.log(`ファイル更新日時 : ${formatModifiedTime(fileInfo.modifiedAt)}\n`);
  logger.log(`READ件数 : ${countResult.formattedCount}`);

  return logger.complete();
}

async function executeJob(logger: JobLogger): Promise<string> {
  const datePrefix = getDatePrefix();

  logger.log(`ファイルパス : ${CONFIG.logDir}`);

  try {
    await validateLogDirectory();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw logger.fail(message);
  }

  let targetFile: string | undefined;

  try {
    targetFile = await findLogFile(datePrefix);
  } catch (error: unknown) {
    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`ログにアクセスできません: ${CONFIG.logDir}${detail}`);
  }

  if (!targetFile) {
    logger.log(`対象ファイルなし (${datePrefix}*_${CONFIG.fileSuffix})`);
    throw logger.fail(`ログファイルが見つかりません (${datePrefix})`);
  }

  let fileInfo: LogFileInfo;

  try {
    fileInfo = await getLogFileInfo(targetFile);
  } catch (error: unknown) {
    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(
      `ログファイル情報を取得できません: ${targetFile}${detail}`,
    );
  }

  let countResult: ReadCountResult;

  try {
    countResult = await readCount(fileInfo.filePath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes(`キーワード '${CONFIG.keyword}'`)) {
      logger.log(`必須キーワード "${CONFIG.keyword}" なし`);
    }

    throw logger.fail(message);
  }

  return writeResultLog(logger, fileInfo, countResult);
}

export async function runJob114(): Promise<string> {
  const logger = new JobLogger();
  return executeJob(logger);
}
