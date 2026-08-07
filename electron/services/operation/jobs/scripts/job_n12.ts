// electron/services/operation/jobs/scripts/job_n12.ts
import fs from "fs-extra";
import path from "path";
import { isSameDay } from "date-fns";

const MAX_RETRIES = 10;
const WAIT_MS = 120000;
const TARGET_DIR = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";
const KEYWORDS = ["098_FTRDCSND", "982_FTRDCSND", "983_FTRDCSND", "FTRDCSNDSD"] as const;

export async function runJobN12(onRetryProgress?: (message: string) => void): Promise<string> {
  const today = new Date();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (!(await fs.pathExists(TARGET_DIR))) {
      if (attempt === MAX_RETRIES) throw new Error(`対象フォルダが見つかりません: ${TARGET_DIR}`);
    } else {
      const files = await fs.readdir(TARGET_DIR);
      let missing: string[] = [...KEYWORDS];

      for (const file of files) {
        const filePath = path.join(TARGET_DIR, file);
        const stats = await fs.stat(filePath);
        if (isSameDay(stats.mtime, today)) {
          missing = missing.filter((kw) => !file.includes(kw));
          if (missing.length === 0) break;
        }
      }

      if (missing.length === 0) return "正常終了";
      if (attempt === MAX_RETRIES) throw new Error(`不足ファイル: ${missing.join(", ")}`);

      const msg = `再試行中 (${attempt}/${MAX_RETRIES}): 不足=${missing.join(", ")}`;
      onRetryProgress?.(msg);
    }
    await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
  }
  throw new Error("規定回数に達しました");
}
