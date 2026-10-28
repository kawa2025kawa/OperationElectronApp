// electron/features/operation/jobs/scripts/nseries/job_n12.ts

import path from "node:path";
import fs from "fs-extra";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { getStatus } from "@electron/features/operation/application/statusManager";
import { JOB_STATUS } from "@shared/types/operation/operationTypes";

const TARGET_DIR1 = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV\\SV";
const TARGET_DIR2 = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";
const REF_KANRI_NO = "49";
const KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

interface FileInfo {
  fileName: string;
  mtime: number;
}

function resolveTargetDir(): string {
  const status = getStatus(REF_KANRI_NO)?.status;

  console.log("[job_n12] DSI8020 status", {
    kanriNo: REF_KANRI_NO,
    status,
  });

  return status === JOB_STATUS.READY || status === JOB_STATUS.WAITING
    ? TARGET_DIR2
    : TARGET_DIR1;
}

async function findLatestFile(
  directory: string,
  files: string[],
  keyword: string,
): Promise<FileInfo | undefined> {
  let latest: FileInfo | undefined;

  for (const fileName of files) {
    if (!fileName.includes(keyword)) continue;

    const stat = await fs.stat(path.join(directory, fileName));

    if (stat.isFile() && (!latest || stat.mtimeMs > latest.mtime)) {
      latest = { fileName, mtime: stat.mtimeMs };
    }
  }

  return latest;
}

export async function runJobN12(): Promise<string> {
  const logger = new JobLogger();

  try {
    const targetDir = resolveTargetDir();
    logger.log(`対象フォルダ : ${targetDir}`);

    if (!(await fs.pathExists(targetDir))) {
      throw new Error(`ディレクトリが存在しません: ${targetDir}`);
    }

    const files = await fs.readdir(targetDir);
    const missing: string[] = [];

    for (const keyword of KEYWORDS) {
      const latest = await findLatestFile(targetDir, files, keyword);

      if (latest) {
        logger.log(latest.fileName);
      } else {
        missing.push(keyword);
        logger.log(`[${keyword}] ファイルが見つかりません`);
      }
    }

    if (missing.length) {
      logger.log(`未検出ファイルあり (対象: ${missing.join(", ")})`);
      return logger.needsAction("");
    }

    return logger.complete();
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    throw logger.fail(error instanceof Error ? error.message : String(error));
  }
}
