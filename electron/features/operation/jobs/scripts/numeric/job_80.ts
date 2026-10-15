// electron/features/operation/jobs/scripts/numeric/job_80.ts

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";

import {
  findFiles,
  getFileInfo,
} from "@electron/features/operation/jobs/scripts/helpers/fileUtils";

import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

const REQUIRED_FILES = ["Okurikomi_toMD_JIZEN", "htsf0060_JIZEN"] as const;

interface MatchedFile {
  target: string;
  fileName: string;
  filePath: string;
  mtime: Date;
}

export async function runJob80(): Promise<string> {
  const today = getDateKey();
  const logger = new JobLogger();

  logger.log(`監視ディレクトリ : ${TARGET_DIR}`);

  if (!(await directoryExists(TARGET_DIR))) {
    throw logger.fail(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  // 固定名ファイルを検索
  const fixedFiles = await Promise.all(
    REQUIRED_FILES.map(async (target): Promise<MatchedFile | null> => {
      const matchedFiles = await findFiles(TARGET_DIR, {
        prefix: target,
      });

      const filePath = matchedFiles[0];

      if (!filePath) {
        return null;
      }

      const fileInfo = await getFileInfo(filePath);

      return {
        target,
        fileName: fileInfo.fileName,
        filePath: fileInfo.filePath,
        mtime: fileInfo.mtime,
      };
    }),
  );

  const hasAllFixed = fixedFiles.every((item) => item !== null);

  if (hasAllFixed) {
    logger.log("固定名ファイルを検出しました");

    for (const item of fixedFiles) {
      if (!item) {
        continue;
      }

      logger.log(`  ${item.fileName}`);
      logger.log(
        `    更新日時 : ${item.mtime
          .toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(/\//g, "/")}`,
      );
    }

    return logger.complete("固定名ファイル確認完了");
  }

  // 固定名ファイルが揃わない場合は、当日の日付付きファイルを検索
  logger.log(`本日日付 (${today}) のファイルを検索中...`);

  const datedFiles = await Promise.all(
    REQUIRED_FILES.map(async (target): Promise<MatchedFile | null> => {
      const matchedFiles = await findFiles(TARGET_DIR, {
        prefix: `${target}_${today}`,
      });

      const filePath = matchedFiles[0];

      if (!filePath) {
        return null;
      }

      const fileInfo = await getFileInfo(filePath);

      return {
        target,
        fileName: fileInfo.fileName,
        filePath: fileInfo.filePath,
        mtime: fileInfo.mtime,
      };
    }),
  );

  const missing: string[] = [];

  for (let i = 0; i < REQUIRED_FILES.length; i++) {
    const target = REQUIRED_FILES[i];
    const item = datedFiles[i];

    if (item) {
      logger.log(`  検出 : ${item.fileName}`);

      logger.log(
        `    更新日時 : ${item.mtime.toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}`,
      );
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
