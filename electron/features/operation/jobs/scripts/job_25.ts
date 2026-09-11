// electron/features/operation/jobs/scripts/job_25.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";
const KEYWORDS = ["htsf0060", "Okurikomi"] as const;

export async function runJob25(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const outputLines: string[] = [];

  const addLine = (message: string = "") => {
    outputLines.push(message);
  };

  addLine(`==================================================`);
  addLine(` [Job25] マスター受信ファイル存在チェック (日付: ${today})`);
  addLine(`==================================================`);

  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  const files = await fs.readdir(TARGET_DIR);
  const todayFiles = files.filter((f) => f.includes(today));

  const missingKeywords: string[] = [];

  for (const kw of KEYWORDS) {
    const matchedFiles = todayFiles.filter((f) => f.includes(kw));

    if (matchedFiles.length === 0) {
      missingKeywords.push(kw);
      addLine(`❌ [キーワード: ${kw}] 未存在 (日付: ${today})`);
      continue;
    }

    // 最新のファイルを特定して更新日時を取得
    const fileWithStats = await Promise.all(
      matchedFiles.map(async (fileName) => {
        const filePath = path.join(TARGET_DIR, fileName);
        const stat = await fs.stat(filePath);
        return { fileName, mtime: stat.mtime };
      }),
    );

    // 更新日時の新しい順にソート
    fileWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const latest = fileWithStats[0];
    const formattedDate = format(latest.mtime, "yyyy/MM/dd HH:mm:ss");

    addLine(`▶ [キーワード: ${kw}] 検出: ${latest.fileName}`);
    addLine(`   └ 更新日時: ${formattedDate}`);
  }

  addLine(`--------------------------------------------------`);

  if (missingKeywords.length > 0) {
    throw new Error(
      `ファイル不足 (未検知キーワード: ${missingKeywords.join(", ")})\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(` [Job25] 正常終了 (全対象ファイル検出完了)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
