// electron/features/operation/jobs/scripts/eseries/job_e1.ts

import path from "node:path";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  checkFileUpdatedToday,
  listFilesInDir,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";

const TARGET_KEYWORDS_E1 = ["EOB_DSP_001"] as const;

interface MatchedFileE1 {
  keyword: string;
  fileName: string;
}

interface JobE1ResultData {
  matchedFiles: MatchedFileE1[];
  missingKeywords: string[];
}

const CONFIG = {
  targetDir: "\\\\mdsyuhai01.BELC01.belc.local\\IF\\EOB棚割\\SND",
  keywords: TARGET_KEYWORDS_E1,
} as const;

/**
 * 当日分の EOB棚割ファイルを受信しているか確認する。
 */
export async function runJobE1(): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkTargetFiles();
    return writeResultLog(logger, result);
  });
}

async function checkTargetFiles(): Promise<JobE1ResultData> {
  const now = new Date();
  const fileNames = await listFilesInDir(CONFIG.targetDir);

  const matchedFiles: MatchedFileE1[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of CONFIG.keywords) {
    let foundFileName: string | null = null;

    for (const fileName of fileNames) {
      if (!fileName.includes(keyword)) continue;

      const status = await checkFileUpdatedToday(
        path.join(CONFIG.targetDir, fileName),
        now,
      );
      if (status.isToday) {
        foundFileName = fileName;
        break;
      }
    }

    if (foundFileName) {
      matchedFiles.push({ keyword, fileName: foundFileName });
    } else {
      missingKeywords.push(keyword);
    }
  }

  return {
    matchedFiles,
    missingKeywords,
  };
}

function writeResultLog(logger: JobLogger, result: JobE1ResultData): string {
  logger.section("対象フォルダ");
  logger.log(CONFIG.targetDir);

  if (result.matchedFiles.length > 0) {
    logger.section("検出ファイル");
    for (const { keyword, fileName } of result.matchedFiles) {
      logger.log(`[${keyword}] ${fileName}`);
    }
  }

  if (result.missingKeywords.length > 0) {
    logger.section("未受信ファイル");
    for (const keyword of result.missingKeywords) {
      logger.log(`[${keyword}] 本日更新されたファイルなし`);
    }

    return logger.needsAction(
      `未受信ファイルあり (対象: ${result.missingKeywords.join(", ")})`,
    );
  }

  return logger.complete();
}