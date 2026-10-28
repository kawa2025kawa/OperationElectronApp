// electron/features/operation/jobs/scripts/numeric/job_80.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import type { JobResult } from "@shared/types/operation/operationTypes";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  requiredFiles: ["Okurikomi_toMD_JIZEN", "htsf0060_JIZEN"],
} as const;

interface MatchedFile {
  fileName: string;
  filePath: string;
  mtime: Date;
}

interface FileCheckResult {
  files: (MatchedFile | null)[];
  missing: string[];
}

function getDateKey(date = new Date()): string {
  return format(date, "yyyyMMdd");
}

function formatModifiedTime(date: Date): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

async function validateTargetDirectory(): Promise<void> {
  try {
    if ((await fs.stat(CONFIG.targetDir)).isDirectory()) {
      return;
    }
  } catch {
    // ディレクトリ不存在・アクセス失敗を下記で統一する
  }

  throw new Error(`フォルダが存在しません: ${CONFIG.targetDir}`);
}

async function findMatchedFile(prefix: string): Promise<MatchedFile | null> {
  const entries = await fs.readdir(CONFIG.targetDir, {
    withFileTypes: true,
  });
  const entry = entries.find(
    (item) => item.isFile() && item.name.startsWith(prefix),
  );

  if (!entry) {
    return null;
  }

  const filePath = path.join(CONFIG.targetDir, entry.name);
  const stat = await fs.stat(filePath);

  return {
    fileName: entry.name,
    filePath,
    mtime: stat.mtime,
  };
}

async function findRequiredFiles(
  prefixes: readonly string[],
): Promise<(MatchedFile | null)[]> {
  return Promise.all(prefixes.map(findMatchedFile));
}

function logMatchedFile(logger: JobLogger, file: MatchedFile): void {
  logger.log(`  ${file.fileName}`);
  logger.log(`    更新日時 : ${formatModifiedTime(file.mtime)}`);
}

function logFiles(logger: JobLogger, files: (MatchedFile | null)[]): void {
  logger.log("検出ファイル");

  for (let index = 0; index < CONFIG.requiredFiles.length; index += 1) {
    const file = files[index];

    if (file) {
      logMatchedFile(logger, file);
    } else {
      logger.log(`  [${CONFIG.requiredFiles[index]}] ファイルが見つかりません`);
    }
  }
}

async function checkRequiredFiles(): Promise<FileCheckResult> {
  await validateTargetDirectory();

  const fixedFiles = await findRequiredFiles(CONFIG.requiredFiles);

  if (fixedFiles.every((file) => file !== null)) {
    return {
      files: fixedFiles,
      missing: [],
    };
  }

  const datedFiles = await findRequiredFiles(
    CONFIG.requiredFiles.map((target) => `${target}_${getDateKey()}`),
  );

  return {
    files: datedFiles,
    missing: CONFIG.requiredFiles.filter(
      (_, index) => datedFiles[index] === null,
    ),
  };
}

async function executeJob(logger: JobLogger): Promise<JobResult> {
  logger.log(`対象フォルダ : ${CONFIG.targetDir}`);

  const result = await checkRequiredFiles();

  logFiles(logger, result.files);

  if (result.missing.length > 0) {
    return {
      success: true,
      kind: "needsAction",
      message: logger.needsAction(""),
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete(),
  };
}

export async function runJob80(): Promise<JobResult> {
  const logger = new JobLogger();

  try {
    return await executeJob(logger);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`ファイル確認に失敗しました${detail}`);
  }
}
