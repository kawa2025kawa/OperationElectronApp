// electron/services/operation/jobs/scripts/job_25.ts
import fs from "fs-extra";
import path from "path";
import { isSameDay } from "date-fns";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";
const TARGET_FILES = ["htsf0060", "Okurikomi"] as const;

export async function runJob25(): Promise<string> {
  if (!(await fs.pathExists(TARGET_DIR))) throw new Error(`ディレクトリが見つかりません: ${TARGET_DIR}`);

  const today = new Date();
  const files = await fs.readdir(TARGET_DIR);
  let missing: string[] = [...TARGET_FILES];

  for (const file of files) {
    const filePath = path.join(TARGET_DIR, file);
    const stats = await fs.stat(filePath);
    if (isSameDay(stats.mtime, today)) {
      missing = missing.filter((kw) => !file.includes(kw));
      if (missing.length === 0) break;
    }
  }

  if (missing.length === 0) return "全ファイル正常確認";
  throw new Error(`欠損ファイル: ${missing.join(", ")}`);
}
