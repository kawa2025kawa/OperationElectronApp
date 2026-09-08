// electron/features/operation/jobs/scripts/job_25.ts
import fs from "fs-extra";
import { format } from "date-fns";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";
const KEYWORDS = ["htsf0060", "Okurikomi"] as const;

export async function runJob25(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");

  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  const files = await fs.readdir(TARGET_DIR);
  const todayFiles = files.filter((f) => f.includes(today));

  // キーワードごとに該当するファイルを取得
  const foundFiles: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of KEYWORDS) {
    const matchedFile = todayFiles.find((f) => f.includes(kw));
    if (matchedFile) {
      foundFiles.push(matchedFile);
    } else {
      missingKeywords.push(kw);
    }
  }

  // ファイルが不足している場合はエラー
  if (missingKeywords.length > 0) {
    throw new Error(
      `ファイル不足 (未検知キーワード: ${missingKeywords.join(", ")})`,
    );
  }

  // 存在するファイル名を改行またはカンマ区切りで返却（モーダルに表示されます）
  return `確認完了:\n${foundFiles.join("\n")}`;
}
