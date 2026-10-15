// electron/features/operation/jobs/scripts/numeric/job_39.ts

import { format, isSameDay } from "date-fns";
import path from "node:path";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";

import {
  findFiles,
  getFileInfo,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";

import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const CONFIG = {
  beforeNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV",
  afterNoonDir: "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV",
  targetFiles: ["Okurikomi_toMD.dat", "htsf0060"] as const,
} as const;

interface FileCheckDetail {
  targetName: string;
  foundName?: string;
  mtime?: Date;
  error?: string;
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
      foundName: targetName,
      mtime: info.mtime,
    };
  } catch {
    return {
      targetName,
      error: "ファイルが存在しません",
    };
  }
}

async function checkAfterNoonFile(
  targetName: string,
  today: string,
): Promise<FileCheckDetail> {
  const matchedFiles = await findFiles(CONFIG.afterNoonDir, {
    prefix: `${targetName}_${today}`,
  });

  if (matchedFiles.length === 0) {
    return {
      targetName,
      error: `${targetName}_${today}* (ファイルなし)`,
    };
  }

  const fileInfo = await getFileInfo(matchedFiles[0]);

  return {
    targetName,
    foundName: fileInfo.fileName,
    mtime: fileInfo.mtime,
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
      continue;
    }

    const dateText = item.mtime
      ? format(item.mtime, "yyyy/MM/dd HH:mm:ss")
      : "-";

    logger.log(`  [${item.targetName}] 検出 : ${item.foundName}`);
    logger.log(`    更新日時 : ${dateText}`);
  }

  if (errors.length > 0) {
    throw logger.fail(`NG: ${errors.join(", ")}`);
  }

  return logger.complete("全対象ファイル確認済");
}
