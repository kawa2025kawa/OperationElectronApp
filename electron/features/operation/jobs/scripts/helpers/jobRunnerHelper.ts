// electron/features/operation/jobs/scripts/helpers/jobRunnerHelper.ts

import os from "node:os";
import path from "node:path";
import { ZipArchive } from "archiver";
import { format, isSameDay } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";
import type { ScriptFilePath } from "@electron/features/operation/runners/scriptRunner";
import { JobLogger } from "./jobLogger";

interface CreateZipOptions {
  filePaths: string[];
  outputDir: string;
  zipPrefix: string;
}

export interface CheckedFileStatus {
  fileName: string;
  filePath: string;
  exists: boolean;
  mtime: Date | null;
  isToday: boolean;
}

interface FindFilesByKeywordsOptions {
  requiredExtension?: string;
  exactMatchCount?: boolean;
}

interface ZipSourceFile {
  filePath: string;
  fileName: string;
  mtime: Date;
}

export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export function getDateKey(
  date: Date = new Date(),
  pattern = "yyyyMMdd",
): string {
  return format(date, pattern);
}

export function formatDateTime(
  date: Date,
  pattern = "yyyy/MM/dd HH:mm:ss",
): string {
  return format(date, pattern);
}

async function compressFiles(
  files: ZipSourceFile[],
  outputZipPath: string,
): Promise<void> {
  if (files.length === 0) {
    throw new Error("ZIPに含めるファイルが指定されていません。");
  }

  const resolvedOutputPath = path.resolve(outputZipPath);
  for (const file of files) {
    const resolvedInputPath = path.resolve(file.filePath);
    const isSamePath =
      process.platform === "win32"
        ? resolvedInputPath.toLowerCase() === resolvedOutputPath.toLowerCase()
        : resolvedInputPath === resolvedOutputPath;

    if (isSamePath) {
      throw new Error(
        `出力ZIPと圧縮対象ファイルのパスが重複しています: ${file.filePath}`,
      );
    }
  }

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputZipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    let settled = false;

    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      archive.destroy();
      output.destroy();
      reject(error);
    };

    output.on("close", () => {
      if (settled) return;
      settled = true;
      resolve();
    });

    output.on("error", fail);
    archive.on("error", fail);
    archive.on("warning", fail);

    archive.pipe(output);

    try {
      for (const file of files) {
        archive.file(file.filePath, {
          name: file.fileName,
          date: file.mtime,
        });
      }

      void archive.finalize().catch((error: unknown) => {
        fail(error instanceof Error ? error : new Error(String(error)));
      });
    } catch (error) {
      fail(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export async function createZipArchive(
  options: CreateZipOptions,
): Promise<string | null> {
  const { filePaths, outputDir, zipPrefix } = options;
  if (filePaths.length === 0) return null;

  try {
    if (!(await directoryExists(outputDir))) return null;

    const files: ZipSourceFile[] = [];
    for (const filePath of filePaths) {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) return null;

      files.push({
        filePath,
        fileName: path.basename(filePath),
        mtime: stat.mtime,
      });
    }

    const outputZipPath = path.join(outputDir, `${zipPrefix}_${getDateKey()}.zip`);
    await compressFiles(files, outputZipPath);
    return outputZipPath;
  } catch {
    return null;
  }
}

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

export function resolveInputPaths(inputFilePath?: ScriptFilePath): string[] {
  if (!inputFilePath) return [];
  const list = Array.isArray(inputFilePath) ? inputFilePath : [inputFilePath];
  return list.map((p) => p.trim()).filter(Boolean);
}

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

export function findFilesByKeywords<TKey extends string>(
  inputPaths: readonly string[],
  keywords: Record<TKey, string>,
  options?: FindFilesByKeywordsOptions,
): Record<TKey, string> {
  const found = {} as Record<TKey, string>;
  const missing: string[] = [];
  const normalizedExt = options?.requiredExtension
    ? (options.requiredExtension.startsWith(".")
        ? options.requiredExtension
        : `.${options.requiredExtension}`
      ).toLowerCase()
    : null;

  if (normalizedExt) {
    const invalidExtFiles = inputPaths
      .filter((filePath) => path.extname(filePath).toLowerCase() !== normalizedExt)
      .map((filePath) => path.basename(filePath));

    if (invalidExtFiles.length > 0) {
      throw new Error(
        `${normalizedExt} 以外のファイルが含まれています: ${invalidExtFiles.join(", ")}`,
      );
    }
  }

  const matchedPaths = new Set<string>();

  for (const [key, keyword] of Object.entries(keywords) as [TKey, string][]) {
    const matches = inputPaths.filter((filePath) =>
      path.basename(filePath).includes(keyword),
    );

    if (matches.length === 0) {
      missing.push(
        normalizedExt ? `${keyword} (${normalizedExt})` : keyword,
      );
      continue;
    }

    if (matches.length > 1) {
      throw new Error(
        `キーワード '${keyword}' に該当するファイルが複数あります: ${matches.map((p) => path.basename(p)).join(", ")}`,
      );
    }

    found[key] = matches[0];
    matchedPaths.add(matches[0]);
  }

  if (missing.length > 0) {
    throw new Error(`必要なファイルが不足しています: ${missing.join(", ")}`);
  }

  if (options?.exactMatchCount) {
    const unexpectedFiles = inputPaths
      .filter((filePath) => !matchedPaths.has(filePath))
      .map((filePath) => path.basename(filePath));

    if (unexpectedFiles.length > 0) {
      throw new Error(
        `対象外のファイルが含まれています: ${unexpectedFiles.join(", ")}`,
      );
    }
  }

  return found;
}

export async function readEncodedText(
  filePath: string,
  encoding = "Shift_JIS",
): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return iconv.decode(buffer, encoding);
}

export async function readEncodedLines(
  filePath: string,
  encoding = "Shift_JIS",
  skipEmpty = true,
): Promise<string[]> {
  const lines = (await readEncodedText(filePath, encoding)).split(/\r?\n/);
  return skipEmpty ? lines.filter((line) => line.trim() !== "") : lines;
}

export async function listFilesInDir(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

export async function assertPathNotExists(
  targetPath: string,
  errorMessage: string,
): Promise<void> {
  if (await fs.pathExists(targetPath)) {
    throw new Error(errorMessage);
  }
}

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

async function createDesktopZip(
  filePaths: string[],
  zipPrefix: string,
): Promise<string | null> {
  return createZipArchive({
    filePaths,
    outputDir: path.join(os.homedir(), "Desktop"),
    zipPrefix,
  });
}

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
