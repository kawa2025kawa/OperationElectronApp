// electron/services/operation/jobs/scripts/job_20.ts
import fs from "fs-extra";
import path from "path";
import { format, subDays } from "date-fns";

const MAX_DIFF_KB = 10000.0;
const TARGET_DIR = "\\\\172.25.101.51\\if\\AUTOORD\\RCV\\SV";

async function getFileSizeKb(dir: string, dateKey: string): Promise<number> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    if (file.includes("JIDOHAT") && file.includes(dateKey)) {
      const stats = await fs.stat(path.join(dir, file));
      return stats.size / 1024.0;
    }
  }
  throw new Error(`対象ファイルなし(日付: ${dateKey})`);
}

export async function runJob20(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyMMdd");
  const lastWeek = format(subDays(now, 7), "yyMMdd");

  if (!(await fs.pathExists(TARGET_DIR))) throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);

  const sizeToday = await getFileSizeKb(TARGET_DIR, today);
  const sizeLast = await getFileSizeKb(TARGET_DIR, lastWeek);
  const diffKb = Math.abs(sizeToday - sizeLast);

  if (diffKb <= MAX_DIFF_KB) return `OK (差異: ${diffKb.toFixed(2)}KB)`;
  throw new Error(`NG 許容値超過: ${diffKb.toFixed(2)}KB (閾値: ${MAX_DIFF_KB.toFixed(0)}KB)`);
}
