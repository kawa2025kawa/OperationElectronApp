// electron/features/operation/jobs/scripts/numeric/job_114.ts

import path from "node:path";
import fs from "fs-extra";
import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  formatDateTime,
  getDateKey,
  listFilesInDir,
  readEncodedText,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";

const CONFIG = {
  host: NETWORK_HOSTS.LOG_192_88,
  logSubPaths: ["diskD", "execute", "log"] as const,
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
  logDir: string;
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

async function processLogFile(): Promise<JobResultData> {
  const logDir = getNetworkHostPath(CONFIG.host, ...CONFIG.logSubPaths);
  let entries: string[];
  try {
    entries = await withNetworkAuthRetry(logDir, () => listFilesInDir(logDir));
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      throw new Error(`フォルダが存在しないかアクセスできません: ${logDir}`);
    }
    throw error;
  }

  const datePrefix = getDateKey(new Date(), "yyMMdd");

  const targetFileName = entries.find(
    (fileName) =>
      fileName.startsWith(datePrefix) && fileName.includes(CONFIG.fileSuffix),
  );

  if (!targetFileName) {
    return {
      logDir,
      datePrefix,
      fileInfo: null,
      countResult: null,
      businessErrorMessage: `対象ファイルなし (${datePrefix}*_${CONFIG.fileSuffix})`,
    };
  }

  const filePath = path.join(logDir, targetFileName);
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
      logDir,
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
    logDir,
    datePrefix,
    fileInfo,
    countResult,
  };
}

function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.log(`ファイルパス : ${result.logDir}`);

  if (result.businessErrorMessage) {
    logger.log(result.businessErrorMessage);
    return logger.needsAction(result.businessErrorMessage);
  }

  if (result.fileInfo && result.countResult) {
    logger.section("検出ファイル");
    logger.log(result.fileInfo.fileName);

    logger.section("ファイル更新日時");
    logger.log(formatDateTime(result.fileInfo.modifiedAt));

    logger.section("READ件数");
    logger.log(result.countResult.formattedCount);

    return logger.complete();
  }

  return logger.needsAction("想定外の状態です");
}