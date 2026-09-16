// electron/features/operation/jobs/scripts/nseries/job_n12.ts

import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\WMSSLIP\\RCV";

const KEYWORDS = [
  "098_FTRDCSND",
  "982_FTRDCSND",
  "983_FTRDCSND",
  "FTRDCSNDSD",
] as const;

export async function runJobN12(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const outputLines: string[] = [];

  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [JobN12] ファイル存在チェック開始 (日付: ${today})`);
  addLine(`==================================================`);
  addLine(`▶ 参照フォルダ: ${TARGET_DIR}`);
  addLine();

  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  const files = await fs.readdir(TARGET_DIR);
  const missing: string[] = [];

  for (const kw of KEYWORDS) {
    const matchedFiles = files.filter((f) => f.includes(kw));

    if (matchedFiles.length === 0) {
      missing.push(kw);
      addLine(`❌ [${kw}] 未存在`);
      continue;
    }

    const fileWithStats = await Promise.all(
      matchedFiles.map(async (fileName) => {
        const filePath = path.join(TARGET_DIR, fileName);
        const stat = await fs.stat(filePath);
        return { fileName, mtime: stat.mtime };
      }),
    );

    fileWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const latest = fileWithStats[0];
    const formattedDate = format(latest.mtime, "yyyy/MM/dd HH:mm:ss");

    addLine(`▶ [${kw}] 検出: ${latest.fileName}`);
    addLine(`   └ 更新日時: ${formattedDate}`);
  }

  addLine(`--------------------------------------------------`);

  if (missing.length > 0) {
    throw new Error(
      `ファイル不足 (欠損: ${missing.join(", ")})\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(` [JobN12] 正常終了 (全4ファイル確認完了)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
