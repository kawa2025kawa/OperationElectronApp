// electron/features/operation/jobs/scripts/eseries/job_e9.ts

import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { isSameDay } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { createZipArchive } from "@electron/features/operation/jobs/scripts/helpers/zipHelper";
import { formatDateTime } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

export interface FileStatusE9 {
  fileName: string;
  filePath: string;
  mtime: Date;
  isToday: boolean;
}

export interface JobE9ResultData {
  matchedFiles: FileStatusE9[];
  dateIssueFiles: FileStatusE9[];
  zipFilePath?: string | null;
}

const CONFIG = {
  targetDir: "\\\\S0088003\\syn_tran\\from_ACOS\\SendData",
  expectedFileCount: 16,
  filePrefix: "FPOPHAT",
  fileExtension: ".TXT",
  zipPrefix: "SendData_POP",
} as const;

/**
 * POP関連ファイル（FPOPHAT*.TXT 16件）の存在と更新日を確認し、ZIPアーカイブを作成する。
 */
export async function runJobE9(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await checkAndArchiveFiles();

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
 * 対象ファイルを検索し、日付検証およびZIPアーカイブ作成を実行する。
 */
async function checkAndArchiveFiles(): Promise<JobE9ResultData> {
  const now = new Date();
  const entries = await fs.readdir(CONFIG.targetDir, { withFileTypes: true });

  const matchedEntries = entries.filter((entry) => {
    if (!entry.isFile()) return false;
    const upperName = entry.name.toUpperCase();
    return (
      upperName.startsWith(CONFIG.filePrefix) &&
      upperName.endsWith(CONFIG.fileExtension)
    );
  });

  const matchedFiles: FileStatusE9[] = [];
  const dateIssueFiles: FileStatusE9[] = [];

  for (const entry of matchedEntries) {
    const filePath = path.join(CONFIG.targetDir, entry.name);
    const fileStat = await fs.stat(filePath);
    const isToday = isSameDay(fileStat.mtime, now);

    const fileStatus: FileStatusE9 = {
      fileName: entry.name,
      filePath,
      mtime: fileStat.mtime,
      isToday,
    };

    matchedFiles.push(fileStatus);

    if (!isToday) {
      dateIssueFiles.push(fileStatus);
    }
  }

  // 想定件数と異なる場合、または日付不整合がある場合はアーカイブを作成しない
  if (
    matchedFiles.length !== CONFIG.expectedFileCount ||
    dateIssueFiles.length > 0
  ) {
    return {
      matchedFiles,
      dateIssueFiles,
    };
  }

  const zipFilePath = await createZipArchive({
    filePaths: matchedFiles.map((file) => file.filePath),
    outputDir: path.join(os.homedir(), "Desktop"),
    zipPrefix: CONFIG.zipPrefix,
  });

  return {
    matchedFiles,
    dateIssueFiles,
    zipFilePath,
  };
}

/**
 * 検証結果をログに出力し、最終ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobE9ResultData): string {
  logger.section("確認対象フォルダ");
  logger.log(CONFIG.targetDir);

  logger.section("検出ファイル");
  for (const file of result.matchedFiles) {
    logger.log(`${file.fileName} (${formatDateTime(file.mtime)})`);
  }

  if (result.zipFilePath) {
    logger.section("出力先");
    logger.log(result.zipFilePath);
  }

  if (result.matchedFiles.length !== CONFIG.expectedFileCount) {
    logger.section("件数不整合");
    logger.log(
      `検出数: ${result.matchedFiles.length}件 / 想定件数: ${CONFIG.expectedFileCount}件`,
    );

    return logger.needsAction(
      `検出ファイル数が不正です (検出: ${result.matchedFiles.length}件 / 想定: ${CONFIG.expectedFileCount}件)`,
    );
  }

  if (result.dateIssueFiles.length > 0) {
    logger.section("日付不整合ファイル");
    const issues = result.dateIssueFiles.map(
      (file) =>
        `更新日が本日ではありません: ${file.fileName} (${formatDateTime(file.mtime, "yyyy/MM/dd")})`,
    );

    for (const issue of issues) {
      logger.log(issue);
    }

    return logger.needsAction(issues.join("\n"));
  }

  if (!result.zipFilePath) {
    throw logger.fail("ZIPアーカイブの作成に失敗しました。");
  }

  return logger.complete();
}
