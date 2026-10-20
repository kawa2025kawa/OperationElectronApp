// electron/features/operation/jobs/scripts/numeric/job_62.ts

import fs from "fs-extra";
import path from "node:path";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\MASTER\\RCV",
  expectedFiles: [
    { keyword: "htsf0060", count: 1 },
    { keyword: "Syohin_toMD_N", count: 4 },
    { keyword: "Tokusyo_toMD_N", count: 4 },
  ],
} as const;

type ExpectedFileRule = (typeof CONFIG.expectedFiles)[number];

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    return (await fs.stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

async function readFileNames(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

function findMatchingFiles(
  fileNames: readonly string[],
  keyword: string,
): string[] {
  return fileNames.filter((fileName) => fileName.includes(keyword));
}

function validateFileCount(
  rule: ExpectedFileRule,
  matchedFiles: readonly string[],
): string | undefined {
  if (matchedFiles.length === rule.count) {
    return undefined;
  }

  return `${rule.keyword} (期待: ${rule.count}, 検出: ${matchedFiles.length})`;
}

export async function runJob62(): Promise<string> {
  const logger = new JobLogger();

  logger.log(`監視ディレクトリ : ${CONFIG.targetDir}`);

  if (!(await directoryExists(CONFIG.targetDir))) {
    throw logger.fail(`ディレクトリが存在しません: ${CONFIG.targetDir}`);
  }

  let fileNames: string[];

  try {
    fileNames = await readFileNames(CONFIG.targetDir);
  } catch {
    throw logger.fail(
      `ディレクトリの読み込みに失敗しました: ${CONFIG.targetDir}`,
    );
  }

  const errors: string[] = [];

  for (const rule of CONFIG.expectedFiles) {
    const matchedFiles = findMatchingFiles(fileNames, rule.keyword);

    for (const fileName of matchedFiles) {
      logger.log(fileName);
    }

    const error = validateFileCount(rule, matchedFiles);

    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw logger.fail(`ファイル件数不一致:\n${errors.join("\n")}`);
  }

  return logger.complete();
}
