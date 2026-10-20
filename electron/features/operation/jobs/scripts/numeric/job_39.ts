// electron/features/operation/jobs/scripts/numeric/job_39.ts

import { format, isSameDay } from "date-fns";
import path from "node:path";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  beforeNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV",
  afterNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  targetFiles: ["Okurikomi_toMD.dat", "htsf0060"] as const,
  maxFilesPerTarget: 2,
} as const;

interface FileCheckDetail {
  targetName: string;
  foundNames?: string[];
  mtime?: Date;
  error?: string;
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

async function getFileInfo(filePath: string): Promise<{
  fileName: string;
  mtime: Date;
}> {
  const stats = await fs.stat(filePath);

  if (!stats.isFile()) {
    throw new Error(`ファイルではありません: ${filePath}`);
  }

  return {
    fileName: path.basename(filePath),
    mtime: stats.mtime,
  };
}

async function checkBeforeNoonFile(
  targetName: string,
  now: Date,
): Promise<FileCheckDetail> {
  const filePath = path.join(CONFIG.beforeNoonDir, targetName);

  try {
    const info = await getFileInfo(filePath);

    if (!isSameDay(info.mtime, now)) {
      return {
        targetName,
        mtime: info.mtime,
        error: "更新日が本日ではありません",
      };
    }

    return {
      targetName,
      foundNames: [info.fileName],
      mtime: info.mtime,
    };
  } catch {
    return {
      targetName,
      error: "ファイルが存在しないか、読み取れません",
    };
  }
}

async function checkAfterNoonFile(
  targetName: string,
  today: string,
): Promise<FileCheckDetail> {
  let entries;

  try {
    entries = await fs.readdir(CONFIG.afterNoonDir, {
      withFileTypes: true,
    });
  } catch {
    return {
      targetName,
      error: `ディレクトリにアクセスできません: ${CONFIG.afterNoonDir}`,
    };
  }

  const prefix = `${targetName}_${today}`;

  const matches = entries.filter(
    (entry) => entry.isFile() && entry.name.startsWith(prefix),
  );

  if (matches.length === 0) {
    return {
      targetName,
      error: `${prefix}* (ファイルなし)`,
    };
  }

  if (matches.length > CONFIG.maxFilesPerTarget) {
    return {
      targetName,
      foundNames: matches.map((entry) => entry.name),
      error: `対象ファイルが上限超過 (${matches.length}件 / 上限${CONFIG.maxFilesPerTarget}件)`,
    };
  }

  return {
    targetName,
    foundNames: matches.map((entry) => entry.name),
  };
}

export async function runJob39(): Promise<string> {
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const today = getDateKey(now);
  const targetDir = isBeforeNoon ? CONFIG.beforeNoonDir : CONFIG.afterNoonDir;
  const timePeriodText = isBeforeNoon ? "午前 (12時前)" : "午後 (12時以降)";
  const logger = new JobLogger();

  logger.log(`時間帯判定       : ${timePeriodText}`);
  logger.log(`対象ディレクトリ : ${targetDir}`);

  if (!(await directoryExists(targetDir))) {
    throw logger.fail(`ディレクトリが存在しません: ${targetDir}`);
  }

  const results = await Promise.all(
    CONFIG.targetFiles.map((name) =>
      isBeforeNoon
        ? checkBeforeNoonFile(name, now)
        : checkAfterNoonFile(name, today),
    ),
  );

  const errors: string[] = [];

  for (const item of results) {
    if (item.error) {
      errors.push(`${item.targetName} (${item.error})`);
      logger.log(`  [${item.targetName}] エラー : ${item.error}`);

      for (const name of item.foundNames ?? []) {
        logger.log(`    ${name}`);
      }

      continue;
    }

    for (const name of item.foundNames ?? []) {
      logger.log(name);
    }
  }

  if (errors.length > 0) {
    throw logger.fail(`NG: ${errors.join(", ")}`);
  }

  return logger.complete();
}
