// electron/services/operation/jobs/scripts/job_34.ts

import fs from "fs-extra";
import iconv from "iconv-lite";
import { format } from "date-fns";

const LOG_PATH = "\\\\192.88.1.220\\log\\SANSAN_TXT_LOAD.log";
//const LOG_PATH = "C:\\Users\\C3088091\\Desktop\\test\\SANSAN_TXT_LOAD.log";

const COMPLETE_MESSAGE = "さんさん畑　売上取り込み処理を終了しました。";

export async function runJob34(): Promise<string> {
  if (!(await fs.pathExists(LOG_PATH))) {
    throw new Error(`ログファイルが存在しません: ${LOG_PATH}`);
  }

  const today = format(new Date(), "yyyy/MM/dd");

  const buffer = await fs.readFile(LOG_PATH);
  const text = iconv.decode(buffer, "Shift_JIS");

  const found = text
    .split(/\r?\n/)
    .reverse()
    .find((line) => line.includes(today) && line.includes(COMPLETE_MESSAGE));

  if (found) {
    return "正常終了";
  }

  throw new Error("本日の売上取り込み終了ログが見つかりません");
}
