// electron/services/operation/jobs/scripts/job_62.ts

//抽出ファイル存在確認

import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const EXPECTED_FILES = [
  { keyword: "htsf0060", count: 1 },
  { keyword: "Syohin_toMD_N", count: 4 },
  { keyword: "Tokusyo_toMD_N", count: 4 },
] as const;

export async function runJob62(): Promise<string> {
  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`対象フォルダが見つかりません: ${TARGET_DIR}`);
  }

  const files = await fs.readdir(TARGET_DIR);

  const matchedFiles: string[] = [];
  const errorDetails: string[] = [];

  for (const rule of EXPECTED_FILES) {
    const found = files.filter((f) => f.includes(rule.keyword));

    // 件数判定
    if (found.length === rule.count) {
      matchedFiles.push(...found);
    } else {
      errorDetails.push(
        `${rule.keyword} (期待数: ${rule.count}, 実際: ${found.length})`,
      );
    }
  }

  // ファイル数が合わないキーワードがある場合はエラー
  if (errorDetails.length > 0) {
    throw new Error(`ファイル数不一致:\n${errorDetails.join("\n")}`);
  }

  // 検出されたファイル名を改行区切りで返却
  return `全ファイル数一致確認:\n${matchedFiles.join("\n")}`;
}
