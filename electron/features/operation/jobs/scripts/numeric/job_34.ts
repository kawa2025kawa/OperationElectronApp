/**
 * electron/features/operation/jobs/scripts/numeric/job_34.ts
 */

import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  logPath: "\\\\192.88.1.220\\log\\SANSAN_TXT_LOAD.log",
  encoding: "Shift_JIS",
  keyboard: "売上取り込み処理を終了しました",
} as const;

export async function runJob34(): Promise<string> {
  const logger = new JobLogger();
  const today = format(new Date(), "yyyy/MM/dd");

  logger.log(`ファイル : ${CONFIG.logPath}`);

  try {
    const text = iconv.decode(
      await fs.readFile(CONFIG.logPath),
      CONFIG.encoding,
    );

    const found = text
      .split(/\r?\n/)
      .reverse()
      .find((line) => line.includes(today) && line.includes(CONFIG.keyboard));

    if (!found) {
      logger.log(`本日の売上取り込み終了ログが見つかりません (${today})`);
      logger.log(`検索キーワード : "${CONFIG.keyboard}"`);

      return logger.needsAction("");
    }

    logger.log("検出ログ :");
    logger.log(`   ${found.trim()}`);

    return logger.complete();
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? ` (${error.message})` : ` (${String(error)})`;

    throw logger.fail(
      `ログファイルの読み込みに失敗しました: ${CONFIG.logPath}${detail}`,
    );
  }
}
