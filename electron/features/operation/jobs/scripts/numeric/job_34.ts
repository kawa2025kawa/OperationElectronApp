// electron/features/operation/jobs/scripts/numeric/job_34.ts

import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  logPath: "\\\\192.88.1.220\\log\\SANSAN_TXT_LOAD.log",
  encoding: "Shift_JIS",
  completeMessage: "売上取り込み処理を終了しました",
} as const;

// fileUtils の getFileInfo をローカル実装
async function getFileInfo(filePath: string): Promise<{
  fileName: string;
  mtime: Date;
}> {
  const stats = await fs.stat(filePath);

  return {
    fileName: filePath.split(/[\\/]/).pop() ?? filePath,
    mtime: stats.mtime,
  };
}

export async function runJob34(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyy/MM/dd");
  const logger = new JobLogger();

  logger.log(`ファイル : ${CONFIG.logPath}`);

  if (!(await fs.pathExists(CONFIG.logPath))) {
    throw logger.fail(`ファイルが存在しません: ${CONFIG.logPath}`);
  }

  const fileInfo = await getFileInfo(CONFIG.logPath);

  logger.log(
    `ファイル更新日時     : ${format(fileInfo.mtime, "yyyy/MM/dd HH:mm:ss")}`,
  );

  const buffer = await fs.readFile(CONFIG.logPath);
  const text = iconv.decode(buffer, CONFIG.encoding);

  const found = text
    .split(/\r?\n/)
    .reverse()
    .find(
      (line) => line.includes(today) && line.includes(CONFIG.completeMessage),
    );

  if (!found) {
    logger.log(`本日の売上取り込み終了ログが見つかりません (${today})`);
    logger.log(`検索キーワード : "${CONFIG.completeMessage}"`);

    throw logger.fail("売上取り込み終了ログが見つかりません");
  }

  logger.log("検出ログ :");
  logger.log(`   ${found.trim()}`);

  return logger.complete();
}
