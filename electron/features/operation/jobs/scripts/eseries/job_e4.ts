// electron/features/operation/jobs/scripts/eseries/job_e4.ts

import fs from "fs-extra";
import { format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetFiles: [
    "\\\\192.2.2.1\\d$\\BELC\\ftp\\ORDERBOOK.pdf",
    "\\\\192.161.2.1\\d$\\BELC\\ftp\\ORDERBOOK.pdf",
  ],
} as const;

interface CheckedFileE4 {
  filePath: string;
  isToday: boolean;
}

interface JobE4ResultData {
  checkedFiles: CheckedFileE4[];
  missingFiles: string[];
}

/**
 * 2つの ORDERBOOK.pdf が本日更新されているか確認する。
 *
 * 業務上の要対応:
 * - ファイルが存在しない
 * - ファイルの更新日が本日ではない
 *
 * システムエラー:
 * - ファイルへのアクセス失敗
 * - ファイルステータス取得失敗
 */
export async function runJobE4(): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await checkTargetFiles();

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
 * 対象ファイルの更新日時が本日か確認する。
 */
async function checkTargetFiles(): Promise<JobE4ResultData> {
  const today = format(new Date(), "yyyy-MM-dd");

  const checkedFiles: CheckedFileE4[] = [];
  const missingFiles: string[] = [];

  for (const filePath of CONFIG.targetFiles) {
    try {
      const { mtime } = await fs.stat(filePath);

      const isToday = format(mtime, "yyyy-MM-dd") === today;

      checkedFiles.push({
        filePath,
        isToday,
      });

      if (!isToday) {
        missingFiles.push(filePath);
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        checkedFiles.push({
          filePath,
          isToday: false,
        });

        missingFiles.push(filePath);
        continue;
      }

      throw error;
    }
  }

  return {
    checkedFiles,
    missingFiles,
  };
}

/**
 * 確認結果をログに出力し、最終ステータスを判定する。
 */
function writeResultLog(logger: JobLogger, result: JobE4ResultData): string {
  logger.section("対象ファイル");

  for (const file of result.checkedFiles) {
    logger.log(`[${file.isToday ? "本日更新" : "未更新"}] ${file.filePath}`);
  }

  if (result.missingFiles.length > 0) {
    return logger.needsAction(
      `本日更新されていないファイルあり (${result.missingFiles.length}件)`,
    );
  }

  return logger.complete();
}
