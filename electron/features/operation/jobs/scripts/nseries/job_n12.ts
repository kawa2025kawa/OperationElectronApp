// electron/features/operation/jobs/scripts/nseries/job_n12.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  getStatuses,
  getTargets,
} from "@electron/features/operation/application/statusManager";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

const TARGET_DIR1 = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV\\SV";
const TARGET_DIR2 = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";

/** 分岐判断の対象とする Job ID */
const REF_JOB_ID = "DSI8020";

const KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

/**
 * 特定の Job ID (DSI8020) のステータスを参照し、監視ディレクトリを取得する
 */
function resolveTargetDir(): string {
  const targets = getTargets();
  const statuses = getStatuses();

  let refKanriNo: string | undefined;

  // 1. 指定された jobId (DSI8020) に対応する kanriNo を検索
  for (const [kanriNo, target] of targets) {
    if ("jobId" in target && String(target.jobId) === REF_JOB_ID) {
      refKanriNo = kanriNo;
      break;
    }
  }

  // 2. 対応するステータスを取得
  const currentStatus = refKanriNo
    ? statuses.get(refKanriNo)?.status
    : undefined;

  // 3. READY または WAITING の場合は TARGET_DIR2、それ以外は TARGET_DIR1
  if (
    currentStatus === JOB_STATUS.READY ||
    currentStatus === JOB_STATUS.WAITING
  ) {
    return TARGET_DIR2;
  }

  return TARGET_DIR1;
}

export async function runJobN12(): Promise<string> {
  const logger = new JobLogger();
  const today = format(new Date(), "yyyyMMdd");
  const TARGET_DIR = resolveTargetDir();

  try {
    logger.log(`処理日 : ${today}`);
    logger.log(`監視ディレクトリ : ${TARGET_DIR}`);

    if (!(await fs.pathExists(TARGET_DIR))) {
      throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
    }

    const files = await fs.readdir(TARGET_DIR);
    const missing: string[] = [];

    for (const keyword of KEYWORDS) {
      const matchedFiles = files.filter((fileName) =>
        fileName.includes(keyword),
      );

      if (matchedFiles.length === 0) {
        missing.push(keyword);
        logger.log(`[${keyword}] 未検出`);
        continue;
      }

      const fileWithStats = await Promise.all(
        matchedFiles.map(async (fileName) => {
          const filePath = path.join(TARGET_DIR, fileName);
          const stat = await fs.stat(filePath);

          return {
            fileName,
            mtime: stat.mtime,
            isFile: stat.isFile(),
          };
        }),
      );

      const latest = fileWithStats
        .filter((file) => file.isFile)
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];

      if (!latest) {
        missing.push(keyword);
        logger.log(`[${keyword}] ファイル情報取得失敗`);
        continue;
      }

      logger.log(`${latest.fileName}`);
    }

    if (missing.length > 0) {
      throw new Error(`未受信ファイルあり (対象: ${missing.join(", ")})`);
    }

    return logger.complete("全ファイル確認完了");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}
