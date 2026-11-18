// electron/features/operation/jobs/scripts/numeric/job_34.ts

import { format } from "date-fns";
import {
  readEncodedLines,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import type { JobResult } from "@shared/types/operation/operationTypes";

const CONFIG = {
  logPath: "\\\\192.88.1.220\\log\\SANSAN_TXT_LOAD.log",
  encoding: "Shift_JIS",
  keyboard: "売上取り込み処理を終了しました",
} as const;

export async function runJob34(): Promise<JobResult> {
  return runJobWithLogger(
    `ログファイルの読み込みに失敗しました: ${CONFIG.logPath}`,
    async (logger) => {
      const today = format(new Date(), "yyyy/MM/dd");
      logger.log(`ファイル : ${CONFIG.logPath}`);

      const lines = await readEncodedLines(CONFIG.logPath, CONFIG.encoding);
      const found = [...lines]
        .reverse()
        .find((line) => line.includes(today) && line.includes(CONFIG.keyboard));

      if (!found) {
        logger.log(`本日の売上取り込み終了ログが見つかりません (${today})`);
        logger.log(`検索キーワード : "${CONFIG.keyboard}"`);

        return {
          success: true,
          kind: "running",
          message: logger.complete(
            `本日の終了ログ未検出 (${today})。バックグラウンドで監視中`,
          ),
        };
      }

      logger.log("検出ログ :");
      logger.log(`    ${found.trim()}`);

      return {
        success: true,
        kind: "success",
        message: logger.complete(),
      };
    },
  );
}