// electron/services/operation/jobs/scripts/job_114.ts
import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { format } from "date-fns";

const LOG_DIR = "\\\\192.88.100.1\\diskD\\execute\\log";
const REQUIRED_KEYWORD = "READ=";

export async function runJob114(): Promise<string> {
  const yymmdd = format(new Date(), "yyMMdd");

  if (!(await fs.pathExists(LOG_DIR))) throw new Error(`対象ディレクトリなし: ${LOG_DIR}`);

  const files = await fs.readdir(LOG_DIR);
  const targetFile = files.find((name) => name.startsWith(yymmdd) && name.includes("ORJH0010.log"));

  if (!targetFile) throw new Error(`本日の対象ファイルなし: ${yymmdd})`);

  const fullPath = path.join(LOG_DIR, targetFile);
  const buffer = await fs.readFile(fullPath);
  const logText = iconv.decode(buffer, "Shift_JIS");

  const match = logText.match(/READ=([^\s\r\n,]+)/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    return `${Number.isNaN(parsed) ? match[1] : parsed}`;
  }

  throw new Error(`エラー (${targetFile}): '${REQUIRED_KEYWORD}' が見つかりません`);
}
