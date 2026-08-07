// electron/services/operation/jobs/scripts/job_39.ts
import fs from "fs-extra";
import path from "path";
import { isSameDay } from "date-fns";

const TARGET_FILES = ["htsf0060", "Okurikomi_toMD"] as const;

export async function runJob39(): Promise<string> {
  const hour = new Date().getHours();
  const folder = hour < 12 ? "\\\\172.25.101.51\\if\\MASTER\\RCV" : "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

  if (!(await fs.pathExists(folder))) throw new Error(`ディレクトリが存在しません: ${folder}`);

  const today = new Date();
  const files = await fs.readdir(folder);
  let missing: string[] = [...TARGET_FILES];

  for (const file of files) {
    const filePath = path.join(folder, file);
    const stats = await fs.stat(filePath);
    if (isSameDay(stats.mtime, today)) {
      missing = missing.filter((kw) => !file.includes(kw));
      if (missing.length === 0) break;
    }
  }

  if (missing.length === 0) return `全ファイル受信確認 (${folder})`;
  throw new Error(`欠損ファイル: ${missing.join(", ")} (${folder})`);
}
