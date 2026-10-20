// electron/features/operation/jobs/scripts/numeric/job_80.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

const REQUIRED_FILES = ["Okurikomi_toMD_JIZEN", "htsf0060_JIZEN"] as const;

interface MatchedFile {
  target: string;
  fileName: string;
  filePath: string;
  mtime: Date;
}

function getDateKey(date = new Date()): string {
  return format(date, "yyyyMMdd");
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    return (await fs.stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

async function findFiles(dirPath: string, prefix: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.startsWith(prefix))
    .map((entry) => path.join(dirPath, entry.name));
}

async function getFileInfo(filePath: string): Promise<MatchedFile> {
  const stat = await fs.stat(filePath);

  return {
    target: "",
    fileName: path.basename(filePath),
    filePath,
    mtime: stat.mtime,
  };
}

async function findMatchedFile(
  target: string,
  prefix: string,
): Promise<MatchedFile | null> {
  const [filePath] = await findFiles(TARGET_DIR, prefix);

  if (!filePath) {
    return null;
  }

  const info = await getFileInfo(filePath);

  return { ...info, target };
}

function formatModifiedTime(date: Date): string {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function logMatchedFile(logger: JobLogger, item: MatchedFile): void {
  logger.log(`  ${item.fileName}`);
  logger.log(`    更新日時 : ${formatModifiedTime(item.mtime)}`);
}

export async function runJob80(): Promise<string> {
  const today = getDateKey();
  const logger = new JobLogger();

  logger.log(`監視ディレクトリ : ${TARGET_DIR}`);

  if (!(await directoryExists(TARGET_DIR))) {
    throw logger.fail(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  const fixedFiles = await Promise.all(
    REQUIRED_FILES.map((target) => findMatchedFile(target, target)),
  );

  if (fixedFiles.every((item) => item !== null)) {
    logger.log("固定名ファイルを検出しました");

    for (const item of fixedFiles) {
      if (item) {
        logMatchedFile(logger, item);
      }
    }

    return logger.complete("固定名ファイル確認完了");
  }

  logger.log(`本日日付 (${today}) のファイルを検索中...`);

  const datedFiles = await Promise.all(
    REQUIRED_FILES.map((target) =>
      findMatchedFile(target, `${target}_${today}`),
    ),
  );

  const missing: string[] = [];

  for (let i = 0; i < REQUIRED_FILES.length; i++) {
    const target = REQUIRED_FILES[i];
    const item = datedFiles[i];

    if (item) {
      logger.log(`  検出 : ${item.fileName}`);
      logger.log(`    更新日時 : ${formatModifiedTime(item.mtime)}`);
    } else {
      missing.push(target);
      logger.log(`  未検出 : [${target}] ファイルが見つかりません`);
    }
  }

  if (missing.length > 0) {
    throw logger.fail(`未受信ファイルあり (対象: ${missing.join(", ")})`);
  }

  return logger.complete("日付付きファイル確認完了");
}
