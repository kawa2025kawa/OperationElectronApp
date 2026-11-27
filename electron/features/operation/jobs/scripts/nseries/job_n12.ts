// electron/features/operation/jobs/scripts/nseries/job_n12.ts

import path from "node:path";
import fs from "fs-extra";

import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { runJobWithLogger } from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";
import { getStatus } from "@electron/features/operation/application/statusManager";
import {
  JOB_STATUS,
  type JobResult,
} from "@shared/types/operation/operationTypes";

const TARGET_KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

const CONFIG = {
  host: NETWORK_HOSTS.MDSYUHAI01,
  subPathsSv: ["if", "WMSSLIP", "RCV", "SV"] as const,
  subPathsRcv: ["if", "WMSSLIP", "RCV"] as const,
  refKanriNo: "49",
  keywords: TARGET_KEYWORDS,
} as const;

type MatchedFile = {
  keyword: string;
  fileName: string;
  mtime: number;
};

type JobResultData = {
  targetDir: string;
  matchedFiles: MatchedFile[];
  missingKeywords: string[];
};

/**
 * 管理番号49のステータスに応じた受信フォルダから、対象キーワードを含む最新ファイルの存在を確認する。
 */
export async function runJobN12(): Promise<JobResult> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await checkTargetFiles();
    return writeResultLog(logger, result);
  });
}

function resolveTargetDir(): string {
  const status = getStatus(CONFIG.refKanriNo)?.status;

  console.log("[job_n12] DSI8020 status", {
    kanriNo: CONFIG.refKanriNo,
    status,
  });

  const subPaths =
    status === JOB_STATUS.READY || status === JOB_STATUS.WAITING
      ? CONFIG.subPathsRcv
      : CONFIG.subPathsSv;

  return getNetworkHostPath(CONFIG.host, ...subPaths);
}

async function findLatestFile(
  directory: string,
  files: string[],
  keyword: string,
): Promise<MatchedFile | null> {
  let latest: MatchedFile | null = null;

  for (const fileName of files) {
    if (!fileName.includes(keyword)) {
      continue;
    }

    const fileStat = await fs.stat(path.join(directory, fileName));

    if (fileStat.isFile() && (!latest || fileStat.mtimeMs > latest.mtime)) {
      latest = {
        keyword,
        fileName,
        mtime: fileStat.mtimeMs,
      };
    }
  }

  return latest;
}

async function checkTargetFiles(): Promise<JobResultData> {
  const targetDir = resolveTargetDir();

  return withNetworkAuthRetry(targetDir, async () => {
    const files = await fs.readdir(targetDir);
    const matchedFiles: MatchedFile[] = [];
    const missingKeywords: string[] = [];

    for (const keyword of CONFIG.keywords) {
      const latest = await findLatestFile(targetDir, files, keyword);

      if (latest) {
        matchedFiles.push(latest);
      } else {
        missingKeywords.push(keyword);
      }
    }

    return {
      targetDir,
      matchedFiles,
      missingKeywords,
    };
  });
}

function writeResultLog(logger: JobLogger, result: JobResultData): JobResult {
  logger.section("対象フォルダ");
  logger.log(result.targetDir);

  if (result.matchedFiles.length > 0) {
    logger.section("検出ファイル");
    for (const file of result.matchedFiles) {
      logger.log(`[${file.keyword}] ${file.fileName}`);
    }
  }

  if (result.missingKeywords.length > 0) {
    logger.section("未検出ファイル");
    for (const keyword of result.missingKeywords) {
      logger.log(`[${keyword}] ファイルが見つかりません（配置待ち）`);
    }

    return {
      success: true,
      kind: "running",
      message: logger.complete(
        `ファイル未検出 (対象: ${result.missingKeywords.join(", ")})。バックグラウンドで監視中`,
      ),
      data: result,
    };
  }

  return {
    success: true,
    kind: "success",
    message: logger.complete(),
    data: result,
  };
}