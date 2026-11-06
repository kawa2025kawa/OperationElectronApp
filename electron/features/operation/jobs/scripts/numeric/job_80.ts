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

type JobResultData = {
  targetDir: string;
  files: (MatchedFile | null)[];
  missing: string[];
};

/**
 * 事前連携ファイル（Okurikomi_toMD_JIZEN, htsf0060_JIZEN）の存在を確認する。
 *
 * 監視継続 (running):
 * - 対象ファイルが不足している場合（バックグラウンドでポーリング監視）
 *
 * 正常終了 (success):
 * - すべての対象ファイルが存在する場合
 *
 * システムエラー:
 * - ディレクトリへのアクセス失敗、ステータス取得失敗
 */
export async function runJob80(): Promise<JobResult> {
  const logger = new JobLogger();

  try {
    const result = await checkRequiredFiles();

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw logger.fail(`ファイル確認に失敗しました${detail}`);
  }
}

function getDateKey(date = new Date()): string {
  return format(date, "yyyyMMdd");
}

function formatModifiedTime(date: Date): string {
  return format(date, "yyyy/MM/dd HH:mm:ss");
}

async function validateTargetDirectory(): Promise<void> {
  const stats = await fs.stat(CONFIG.targetDir);
  if (!stats.isDirectory()) {
    throw new Error(`フォルダが存在しません: ${CONFIG.targetDir}`);
  }
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

/**
 * 固定名または日付付き名で必須ファイルを探索・確認する。
 */
async function checkRequiredFiles(): Promise<JobResultData> {
  await validateTargetDirectory();

  const fixedFiles = await findRequiredFiles(CONFIG.requiredFiles);

  if (fixedFiles.every((file) => file !== null)) {
    return {
      targetDir: CONFIG.targetDir,
      files: fixedFiles,
      missing: [],
    };
  }

  const datedFiles = await findRequiredFiles(
    CONFIG.requiredFiles.map((target) => `${target}_${getDateKey()}`),
  );

  return {
    targetDir: CONFIG.targetDir,
    files: datedFiles,
    missing: CONFIG.requiredFiles.filter(
      (_, index) => datedFiles[index] === null,
    ),
  };
}

/**
 * 検出結果をログに出力し、JobResult を返却する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): JobResult {
  logger.log(`対象フォルダ : ${result.targetDir}`);
  logger.section("検出ファイル");

  for (let index = 0; index < CONFIG.requiredFiles.length; index += 1) {
    const file = result.files[index];

    if (file) {
      logger.log(`  ${file.fileName}`);
      logger.log(`    更新日時 : ${formatModifiedTime(file.mtime)}`);
    } else {
      logger.log(
        `  [${CONFIG.requiredFiles[index]}] ファイルが見つかりません（配置待ち）`,
      );
    }
  }

  if (result.missing.length > 0) {
    return {
      success: true,
      kind: "running",
      message: logger.complete(
        `ファイル未検出 (対象: ${result.missing.join(", ")})。バックグラウンドで監視中`,
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
