// electron/services/operation/jobs/scripts/job_34.ts
import fs from "fs-extra";
import iconv from "iconv-lite";
import { format } from "date-fns";

const LOG_PATH = "\\\\192.88.1.220\\log\\SANSAN_TXT_LOAD.log";

export async function runJob34(): Promise<string> {
  if (!(await fs.pathExists(LOG_PATH))) throw new Error(`ログファイルが存在しません: ${LOG_PATH}`);

  const today = format(new Date(), "yyyy/MM/dd");
  const buffer = await fs.readFile(LOG_PATH);
  const text = iconv.decode(buffer, "Shift_JIS");

  const lines = text.split(/\r?\n/).reverse();
  const matched = lines.find((line) => line.includes(today) && line.includes("追加"));

  if (matched) return `正常: ${matched.trim()}`;
  throw new Error("本日分の追加件数ログが見つかりません");
}
