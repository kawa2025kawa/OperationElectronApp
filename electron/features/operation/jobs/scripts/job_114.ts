// electron/features/operation/jobs/scripts/job_114.ts
// 自動発注6時00分件数確認

import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { format } from "date-fns";

const LOG_DIR = "\\\\192.88.100.1\\diskD\\execute\\log";
const REQUIRED_KEYWORD = "READ=";

export async function runJob114(): Promise<string> {
  const yymmdd = format(new Date(), "yyMMdd");

  if (!(await fs.pathExists(LOG_DIR)))
    throw new Error(`対象ディレクトリなし: ${LOG_DIR}`);

  const files = await fs.readdir(LOG_DIR);
  const targetFile = files.find(
    (name) => name.startsWith(yymmdd) && name.includes("ORJH0010.log"),
  );

  if (!targetFile) throw new Error(`本日の対象ファイルなし: ${yymmdd})`);

  const buffer = await fs.readFile(path.join(LOG_DIR, targetFile));
  const logText = iconv.decode(buffer, "Shift_JIS");

  const match = logText.match(/READ=([^\s\r\n,]+)/);
  if (match?.[1]) {
    const parsed = parseInt(match[1], 10);
    // 数値としてパースできる場合は 3桁カンマ区切り + "件" にする（例: 1,234件）
    const countText = Number.isNaN(parsed)
      ? `${match[1]}件`
      : `${parsed.toLocaleString()}件`;

    return countText;
  }

  throw new Error(
    `エラー (${targetFile}): '${REQUIRED_KEYWORD}' が見つかりません`,
  );
}
