// electron/features/operation/jobs/scripts/eseries/job_e9.ts

import path from "node:path";
import os from "node:os";
import { readdir, stat } from "node:fs/promises";
import { isSameDay } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { createZipArchive } from "@electron/features/operation/jobs/scripts/helpers/zipHelper";
import { formatDateTime } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const TARGET_DIR = "\\\\S0088003\\syn_tran\\from_ACOS\\SendData";
const EXPECTED_FILE_COUNT = 16;
const FILE_PREFIX = "FPOPHAT";
const FILE_EXTENSION = ".TXT";

interface FileInfo {
  fileName: string;
  filePath: string;
  mtime: Date;
}

async function findFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dirPath, entry.name));
}

function isTargetFile(filePath: string): boolean {
  const fileName = path.basename(filePath).toUpperCase();

  return fileName.startsWith(FILE_PREFIX) && fileName.endsWith(FILE_EXTENSION);
}

async function getFileInfo(filePath: string): Promise<FileInfo> {
  const fileStat = await stat(filePath);

  return {
    fileName: path.basename(filePath),
    filePath,
    mtime: fileStat.mtime,
  };
}

async function validateFileDates(
  filePaths: string[],
  now: Date,
  logger: JobLogger,
): Promise<string[]> {
  const issues: string[] = [];

  for (const filePath of filePaths) {
    const file = await getFileInfo(filePath);

    logger.log(`ファイル名 : ${file.fileName}`);
    logger.log(`更新日時 : ${formatDateTime(file.mtime)}`);

    if (isSameDay(file.mtime, now)) continue;

    issues.push(
      `更新日が本日ではありません: ${file.fileName} (${formatDateTime(file.mtime, "yyyy/MM/dd")})`,
    );
  }

  return issues;
}

export async function runJobE9(): Promise<string> {
  const logger = new JobLogger();
  const now = new Date();

  try {
    logger.log(`対象ディレクトリ : ${TARGET_DIR}`);
    logger.log(`期待ファイル数 : ${EXPECTED_FILE_COUNT}件`);
    logger.log("検索条件 : FPOPHAT*.TXT（大文字・小文字を区別しない）");

    const allFilePaths = await findFiles(TARGET_DIR);
    const matchedFilePaths = allFilePaths.filter(isTargetFile);

    logger.log(`検出ファイル数 : ${matchedFilePaths.length}件`);

    if (matchedFilePaths.length !== EXPECTED_FILE_COUNT) {
      return logger.needsAction(
        `ファイル件数不一致 (期待値: ${EXPECTED_FILE_COUNT}, 実際: ${matchedFilePaths.length})`,
      );
    }

    const dateIssues = await validateFileDates(matchedFilePaths, now, logger);

    if (dateIssues.length > 0) {
      return logger.needsAction(dateIssues.join("\n"));
    }

    logger.log("更新日検証結果 : 正常");

    const message = await createZipArchive(
      {
        filePaths: matchedFilePaths,
        outputDir: path.join(os.homedir(), "Desktop"),
        zipPrefix: "SendData_POP",
        includeFileList: true,
      },
      logger,
    );

    return logger.complete(message);
  } catch (error: unknown) {
    throw logger.fail(error instanceof Error ? error.message : String(error));
  }
}
