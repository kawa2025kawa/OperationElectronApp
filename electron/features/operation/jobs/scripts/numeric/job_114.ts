// electron/features/operation/jobs/scripts/numeric/job_114.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  listFilesInExistingDir,
  readEncodedText,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";

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
  return runJobWithLogger("ログ処理に失敗しました", async (logger) => {
    const result = await processLogFile();
    return writeResultLog(logger, result);
  });
}

function getDatePrefix(date = new Date()): string {
  return format(date, "yyMMdd");
}

function formatModifiedTime(date: Date): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

async function processLogFile(): Promise<JobResultData> {
  const entries = await listFilesInExistingDir(CONFIG.logDir);
  const datePrefix = getDatePrefix();

  const targetFileName = entries.find(
    (fileName) =>
      fileName.startsWith(datePrefix) && fileName.includes(CONFIG.fileSuffix),
  );

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

  const text = await readEncodedText(filePath, CONFIG.encoding);
  const match = text.match(/READ=([^\s\r\n,]+)/);

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

function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.log(`ファイルパス : ${CONFIG.logDir}`);

  if (result.businessErrorMessage) {
    logger.log(result.businessErrorMessage);
    return logger.needsAction(result.businessErrorMessage);
  }

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