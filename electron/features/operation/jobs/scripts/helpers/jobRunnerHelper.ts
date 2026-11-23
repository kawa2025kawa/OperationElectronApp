// electron/features/operation/jobs/scripts/helpers/jobRunnerHelper.ts

import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import iconv from "iconv-lite";
import { isSameDay } from "date-fns";
import type { ScriptFilePath } from "@shared/types/operation/operationTypes";
import { JobLogger } from "./jobLogger";
import { directoryExists, formatDateTime } from "./timeUtils";
import { createZipArchive } from "./zipHelper";

/**
- JobLogger の初期化と定型 try-catch エラー整形を共通化するラッパー。
- すでに JobLogger.fail で整形済みの例外（"\n\n▶ " を含む）は二重ラップせずそのまま再送出する。
 */
export async function runJobWithLogger<T>(
  defaultErrorPrefix: string,
  handler: (logger: JobLogger) => Promise<T>,
): Promise<T> {
  const logger = new JobLogger();

  try {
    return await handler(logger);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw logger.fail(`${defaultErrorPrefix}${detail}`);
  }
}

/**
- ScriptFilePath (string | string[] | undefined) を空文字除外済みの配列に正規化する。
 */
export function resolveInputPaths(inputFilePath?: ScriptFilePath): string[] {
  if (!inputFilePath) return [];
  const list = Array.isArray(inputFilePath) ? inputFilePath : [inputFilePath];
  return list.map((p) => p.trim()).filter(Boolean);
}

/**
- 単一入力ファイルの存在を検証してパスを返す。
 */
export async function resolveSingleInputFile(
  inputFilePath?: ScriptFilePath,
): Promise<string> {
  const paths = resolveInputPaths(inputFilePath);

  if (paths.length === 0) {
    throw new Error(
      "ファイルが指定されていません。ファイルをドロップしてください。",
    );
  }

  if (paths.length > 1) {
    throw new Error("ファイルは1つだけ指定してください。");
  }

  const targetPath = paths[0];
  if (!(await fs.pathExists(targetPath))) {
    throw new Error(`指定されたファイルが存在しません: ${targetPath}`);
  }

  return targetPath;
}

/**
- 入力パス一覧から各キーワードを含むファイルを特定し、不足があれば例外を送出する。
 */
export function findFilesByKeywords<TKey extends string>(
  inputPaths: readonly string[],
  keywords: Record<TKey, string>,
): Record<TKey, string> {
  const found = {} as Record<TKey, string>;
  const missing: string[] = [];

  for (const [key, keyword] of Object.entries(keywords) as [TKey, string][]) {
    const matched = inputPaths.find((filePath) =>
      path.basename(filePath).includes(keyword),
    );
    if (matched) {
      found[key] = matched;
    } else {
      missing.push(keyword);
    }
  }

  if (missing.length > 0) {
    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  return found;
}

/**
- 指定エンコーディング（既定: Shift_JIS）でファイル全文を読み込む。
 */
export async function readEncodedText(
  filePath: string,
  encoding = "Shift_JIS",
): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return iconv.decode(buffer, encoding);
}

/**
- 指定エンコーディング（既定: Shift_JIS）でファイルを行配列として読み込む。
 */
export async function readEncodedLines(
  filePath: string,
  encoding = "Shift_JIS",
  skipEmpty = true,
): Promise<string[]> {
  const lines = (await readEncodedText(filePath, encoding)).split(/\r?\n/);
  return skipEmpty ? lines.filter((line) => line.trim() !== "") : lines;
}

/**
- 指定ディレクトリ内のファイル名一覧を取得する。
 */
export async function listFilesInDir(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

/**
- フォルダの存在を確認したうえでファイル名一覧を取得する。
 */
export async function listFilesInExistingDir(
  dirPath: string,
  missingMessage = `フォルダが存在しないかアクセスできません: ${dirPath}`,
): Promise<string[]> {
  if (!(await directoryExists(dirPath))) {
    throw new Error(missingMessage);
  }
  return listFilesInDir(dirPath);
}

/**
- 指定パスが存在しないことを検証し、既に存在すれば指定メッセージで例外を送出する。
 */
export async function assertPathNotExists(
  targetPath: string,
  errorMessage: string,
): Promise<void> {
  if (await fs.pathExists(targetPath)) {
    throw new Error(errorMessage);
  }
}

export interface CheckedFileStatus {
  fileName: string;
  filePath: string;
  exists: boolean;
  mtime: Date | null;
  isToday: boolean;
}

/**
- 指定ファイルパスの存在と本日更新有無を確認する。
 */
export async function checkFileUpdatedToday(
  filePath: string,
  now: Date = new Date(),
): Promise<CheckedFileStatus> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return {
        fileName: path.basename(filePath),
        filePath,
        exists: false,
        mtime: null,
        isToday: false,
      };
    }

    return {
      fileName: path.basename(filePath),
      filePath,
      exists: true,
      mtime: stat.mtime,
      isToday: isSameDay(stat.mtime, now),
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return {
        fileName: path.basename(filePath),
        filePath,
        exists: false,
        mtime: null,
        isToday: false,
      };
    }
    throw error;
  }
}

/**
- デスクトップに日付付きZIPを作成する。
 */
export async function createDesktopZip(
  filePaths: string[],
  zipPrefix: string,
): Promise<string | null> {
  return createZipArchive({
    filePaths,
    outputDir: path.join(os.homedir(), "Desktop"),
    zipPrefix,
  });
}

/**
- 対象ファイル群の本日更新確認を行い、すべて正常であればデスクトップへZIPを作成する。
 */
export async function checkAndArchiveTodayFiles(
  targetDir: string,
  fileNames: readonly string[],
  zipPrefix: string,
  canArchive = true,
  now: Date = new Date(),
): Promise<{
  matchedFiles: CheckedFileStatus[];
  dateIssueFiles: CheckedFileStatus[];
  zipFilePath?: string | null;
}> {
  const matchedFiles = await Promise.all(
    fileNames.map((fileName) =>
      checkFileUpdatedToday(path.join(targetDir, fileName), now),
    ),
  );
  const dateIssueFiles = matchedFiles.filter((file) => !file.isToday);

  if (!canArchive || dateIssueFiles.length > 0) {
    return { matchedFiles, dateIssueFiles };
  }

  const zipFilePath = await createDesktopZip(
    matchedFiles.map((file) => file.filePath),
    zipPrefix,
  );

  return { matchedFiles, dateIssueFiles, zipFilePath };
}

/**
- 検出ファイル一覧（ファイル名 + 更新日時）をログに記録する。
 */
export function logCheckedFiles(
  logger: JobLogger,
  files: readonly CheckedFileStatus[],
  sectionTitle = "検出ファイル",
): void {
  if (files.length === 0) return;

  logger.section(sectionTitle);
  for (const file of files) {
    const timeLabel = file.mtime ? formatDateTime(file.mtime) : "不明";
    logger.log(`${file.fileName} (${timeLabel})`);
  }
}

/**
- 更新日が本日ではないファイル一覧をログに記録し、要対応メッセージを返す。
 */
export function logDateIssuesAndNeedsAction(
  logger: JobLogger,
  dateIssueFiles: readonly CheckedFileStatus[],
): string {
  logger.section("日付不整合ファイル");
  const issues = dateIssueFiles.map((file) => {
    const dateLabel = file.mtime
      ? formatDateTime(file.mtime, "yyyy/MM/dd")
      : "不明";
    return `更新日が本日ではありません: ${file.fileName} (${dateLabel})`;
  });

  for (const issue of issues) {
    logger.log(issue);
  }

  return logger.needsAction(issues.join("\n"));
}