// electron/features/operation/jobs/scripts/eseries/job_e4.ts

import path from "node:path";
import fs from "fs-extra";
import { isSameDay } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";
import { formatDateTime } from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import {
  checkFileUpdatedToday,
  runJobWithLogger,
  type CheckedFileStatus,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  targetFiles: [
    "\\\\192.2.2.1\\d$\\BELC\\ftp\\ORDERBOOK.pdf",
    "\\\\192.161.2.1\\d$\\BELC\\ftp\\ORDERBOOK.pdf",
  ],
} as const;

interface TargetFileCheckResult {
  filePath: string;
  status: CheckedFileStatus | null;
  accessErrorCode?: string;
  existsInDirOnly?: boolean;
}

interface JobE4ResultData {
  checkedFiles: TargetFileCheckResult[];
  issueFiles: TargetFileCheckResult[];
}

/**
 * 2つの ORDERBOOK.pdf が本日更新されているか確認する。
 */
export async function runJobE4(): Promise<JobResult> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkTargetFiles();
    return writeResultLog(logger, result);
  });
}

async function checkFileViaParentDir(
  filePath: string,
  now: Date,
): Promise<TargetFileCheckResult | null> {
  const dirPath = path.dirname(filePath);
  const targetName = path.basename(filePath);

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const matched = entries.find(
      (entry) =>
        entry.isFile() && entry.name.toLowerCase() === targetName.toLowerCase(),
    );

    if (!matched) {
      return {
        filePath,
        status: {
          fileName: targetName,
          filePath,
          exists: false,
          mtime: null,
          isToday: false,
        },
      };
    }

    try {
      const stat = await fs.stat(path.join(dirPath, matched.name));
      return {
        filePath,
        status: {
          fileName: matched.name,
          filePath,
          exists: true,
          mtime: stat.mtime,
          isToday: isSameDay(stat.mtime, now),
        },
      };
    } catch {
      return {
        filePath,
        status: null,
        existsInDirOnly: true,
        accessErrorCode: "EPERM",
      };
    }
  } catch {
    return null;
  }
}

async function inspectTargetFile(
  filePath: string,
  now: Date,
): Promise<TargetFileCheckResult> {
  try {
    const status = await withNetworkAuthRetry(filePath, () =>
      checkFileUpdatedToday(filePath, now),
    );
    return {
      filePath,
      status,
    };
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null
        ? (error as { code?: string }).code
        : undefined;

    if (code === "EPERM" || code === "EACCES") {
      const fallbackResult = await checkFileViaParentDir(filePath, now);
      if (fallbackResult) {
        return fallbackResult;
      }

      return {
        filePath,
        status: null,
        accessErrorCode: code,
      };
    }

    throw error;
  }
}

async function checkTargetFiles(): Promise<JobE4ResultData> {
  const now = new Date();
  const checkedFiles = await Promise.all(
    CONFIG.targetFiles.map((filePath) => inspectTargetFile(filePath, now)),
  );

  const issueFiles = checkedFiles.filter(
    (item) => item.status === null || !item.status.isToday,
  );

  return {
    checkedFiles,
    issueFiles,
  };
}

function formatFileStatusLabel(item: TargetFileCheckResult): string {
  if (item.existsInDirOnly) {
    return "ファイル存在確認済・更新日時取得不可 (EPERM)";
  }

  if (item.accessErrorCode) {
    return `アクセス不可 (${item.accessErrorCode})`;
  }

  if (!item.status || !item.status.exists) {
    return "ファイルなし";
  }

  const timeLabel = item.status.mtime
    ? formatDateTime(item.status.mtime)
    : "不明";
  return item.status.isToday
    ? `本日更新 (${timeLabel})`
    : `未更新 (${timeLabel})`;
}

function writeResultLog(logger: JobLogger, result: JobE4ResultData): JobResult {
  logger.section("対象ファイル");

  for (const item of result.checkedFiles) {
    logger.log(`[${formatFileStatusLabel(item)}] ${item.filePath}`);
  }

  if (result.issueFiles.length > 0) {
    const hasAccessError = result.issueFiles.some(
      (item) => item.accessErrorCode !== undefined,
    );
    const summary = hasAccessError
      ? `アクセス不可または本日未更新のファイルあり (${result.issueFiles.length}件)`
      : `本日更新されていないファイルあり (${result.issueFiles.length}件)`;

    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(summary),
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
