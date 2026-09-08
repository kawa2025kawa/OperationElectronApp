// electron/features/operation/jobs/scripts/job_n12.ts
import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";
const KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

export async function runJobN12(): Promise<string> {
  if (!(await fs.pathExists(TARGET_DIR)))
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  const files = await fs.readdir(TARGET_DIR);

  const missing = KEYWORDS.filter((kw) => !files.some((f) => f.includes(kw)));
  if (missing.length === 0) return "正常終了";

  throw new Error(`ファイル不足: ${missing.join(", ")}`);
}
