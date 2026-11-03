// electron/features/operation/jobs/scripts/eseries/job_e8.ts

import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { isSameDay } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { createZipArchive } from "@electron/features/operation/jobs/scripts/helpers/zipHelper";
import { formatDateTime } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

export const TARGET_FILES_E8 = [
  "JCATANAWARI.TXT",
  "JCAPRIPC2.TXT",
  "SHELF_ERR_DATA.TXT",
] as const;

export type JobE8TargetFileName = (typeof TARGET_FILES_E8)[number];

export interface FileStatusE8 {
  fileName: string;
  filePath: string;
  mtime: Date;
  isToday: boolean;
}

export interface JobE8ResultData {
  matchedFiles: FileStatusE8[];
  missingFiles: string[];
  dateIssueFiles: FileStatusE8[];
  zipMessage?: string;
}

const CONFIG = {
  targetDir: "\\\\S0088003\\syn_tran\\from_ACOS\\SendData",
  targetFiles: TARGET_FILES_E8,
  zipPrefix: "SendData_Shelf",
} as const;

/**
 * 棚割関連ファイル（3ファイル）の存在と更新日を確認し、ZIPアーカイブを作成する。
 *
 * 確認先:
 * - \\S0088003\syn_tran\from_ACOS\SendData
 *
 * 業務上の要対応:
 * - 対象ファイルが不足している場合
 * - ファイルの更新日が本日でない場合
 *
 * システムエラー:
 * - ディレクトリへのアクセス失敗
 * - ファイル情報取得失敗
 * - ZIPアーカイブ作成失敗
 */
export async function runJobE8(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await checkAndArchiveFiles(logger);

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
 * ファイルの存在と日付を検証し、全条件を満たしていればZIPを作成する。
 */
async function checkAndArchiveFiles(
  logger: JobLogger,
): Promise<JobE8ResultData> {
  const now = new Date();
  const entries = await fs.readdir(CONFIG.targetDir, { withFileTypes: true });

  const currentFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  const currentFileSet = new Set(currentFiles);
  const missingFiles = CONFIG.targetFiles.filter(
    (fileName) => !currentFileSet.has(fileName),
  );

  const matchedFiles: FileStatusE8[] = [];
  const dateIssueFiles: FileStatusE8[] = [];

  for (const fileName of CONFIG.targetFiles) {
    if (!currentFileSet.has(fileName)) {
      continue;
    }

    const filePath = path.join(CONFIG.targetDir, fileName);
    const fileStat = await fs.stat(filePath);
    const isToday = isSameDay(fileStat.mtime, now);

    const fileStatus: FileStatusE8 = {
      fileName,
      filePath,
      mtime: fileStat.mtime,
      isToday,
    };

    matchedFiles.push(fileStatus);

    if (!isToday) {
      dateIssueFiles.push(fileStatus);
    }
  }

  // 不足または日付不整合がある場合はアーカイブを作成しない
  if (missingFiles.length > 0 || dateIssueFiles.length > 0) {
    return {
      matchedFiles,
      missingFiles,
      dateIssueFiles,
    };
  }

  const zipMessage = await createZipArchive(
    {
      filePaths: matchedFiles.map((file) => file.filePath),
      outputDir: path.join(os.homedir(), "Desktop"),
      zipPrefix: CONFIG.zipPrefix,
    },
    logger,
  );

  return {
    matchedFiles,
    missingFiles,
    dateIssueFiles,
    zipMessage,
  };
}

/**
 * 検証結果をログに出力し、最終ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobE8ResultData): string {
  logger.section("確認対象フォルダ");
  logger.log(CONFIG.targetDir);

  if (result.matchedFiles.length > 0) {
    logger.section("検出ファイル");
    for (const file of result.matchedFiles) {
      logger.log(`${file.fileName} (${formatDateTime(file.mtime)})`);
    }
  }

  if (result.missingFiles.length > 0) {
    logger.section("不足ファイル");
    for (const fileName of result.missingFiles) {
      logger.log(fileName);
    }

    return logger.needsAction(
      `不足ファイルあり (対象: ${result.missingFiles.join(", ")})`,
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

  return logger.complete(result.zipMessage);
}
