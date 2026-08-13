// electron/services/operation/jobs/scripts/job_16.ts
import fs from "fs-extra";
import { format } from "date-fns";

const NORMAL_ERROR_PATH = "\\\\192.88.1.3\\syn_tran";
const FARMERS_ERROR_PATH = "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー";
const TARGET_PREFIX = "SANSAN_ERROR_";

function selectTargetDirectory(): string {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour < 8 || (hour === 8 && minute <= 30)) return NORMAL_ERROR_PATH;
  return FARMERS_ERROR_PATH;
}

export async function runJob16(): Promise<string> {
  const dir = selectTargetDirectory();
  const today = format(new Date(), "yyyyMMdd");
  const targetPrefix = `${TARGET_PREFIX}${today}`;

  if (!(await fs.pathExists(dir)))
    throw new Error(`ディレクトリが存在しません: ${dir}`);

  const files = await fs.readdir(dir);
  const found = files.some(
    (file) => file.startsWith(targetPrefix) && file.endsWith(".txt"),
  );

  if (found) throw new Error("SANSAN_ERRORファイルが存在します");
  return "正常終了";
}
