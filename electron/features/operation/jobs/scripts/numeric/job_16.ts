/**
 * electron/features/operation/jobs/scripts/numeric/job_16.ts
 */

import path from "path";
import fs from "fs-extra";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  normalErrorPath: "\\\\192.88.1.3\\syn_tran",
  farmersErrorPath: "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー",
  confirmedPath: "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー\\確認済",
  targetPrefix: "SANSAN_ERROR_",
  cutoffHour: 8,
  cutoffMinute: 30,
} as const;

type JobResult = {
  targetDir: string;
  targetFile: string | null;
};

/**
 * 当日分の SANSAN エラーファイルを確認する。
 *
 * 確認先:
 * - 08:30以前: 通常ディレクトリ
 * - 08:30以降: ファーマーズエラーディレクトリ
 *
 * 業務上の要対応:
 * - エラーファイルを検出した場合、確認済フォルダへ移動する
 *
 * システムエラー:
 * - ディレクトリへのアクセス失敗
 * - ファイルの移動失敗
 */
export async function runJob16(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await findTargetFile();

    await moveTargetFile(result);

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`ファイル処理に失敗しました${detail}`);
  }
}

/**
 * 実行時刻に応じた確認先を選択する。
 *
 * 08:30以前:
 * - 通常ディレクトリ
 *
 * 08:30以降:
 * - ファーマーズエラーディレクトリ
 */
function selectDirectoryByTime(now: Date): string {
  const cutoff = new Date(now);
  cutoff.setHours(CONFIG.cutoffHour, CONFIG.cutoffMinute, 0, 0);

  return now <= cutoff ? CONFIG.normalErrorPath : CONFIG.farmersErrorPath;
}

/**
 * 当日分の SANSAN エラーファイルを検索する。
 *
 * 対象ファイルは1件のみを前提とする。
 */
async function findTargetFile(): Promise<JobResult> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const searchPattern = `${CONFIG.targetPrefix}${today}`;
  const targetDir = selectDirectoryByTime(now);

  const entries = await fs.readdir(targetDir, {
    withFileTypes: true,
  });

  const targetFile = entries.find(
    (entry) => entry.isFile() && entry.name.includes(searchPattern),
  );

  return {
    targetDir,
    targetFile: targetFile ? path.join(targetDir, targetFile.name) : null,
  };
}

/**
 * 検出したエラーファイルを確認済フォルダへ移動する。
 */
async function moveTargetFile(result: JobResult): Promise<void> {
  if (result.targetFile === null) {
    return;
  }

  await fs.ensureDir(CONFIG.confirmedPath);

  const destinationPath = path.join(
    CONFIG.confirmedPath,
    path.basename(result.targetFile),
  );

  await fs.move(result.targetFile, destinationPath, {
    overwrite: false,
  });

  result.targetFile = destinationPath;
}

/**
 * 検索結果と移動結果をログに出力する。
 */
function writeResultLog(logger: JobLogger, result: JobResult): string {
  if (result.targetFile === null) {
    logger.log("エラーファイルなし");
    return logger.complete();
  }

  logger.section("検出ファイル");
  logger.log(result.targetFile);
  logger.log("バイヤーに対応依頼");

  return logger.needsAction("");
}
