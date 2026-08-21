// electron/services/operation/jobs/scripts/job_39.ts

import fs from "fs-extra";
import path from "node:path";
import { isSameDay } from "date-fns";

const BEFORE_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const AFTER_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

const TARGET_FILES = ["Okurikomi_toMD.dat", "htsf0060"] as const;

function selectTargetDirectory(): string {
  return new Date().getHours() < 12 ? BEFORE_NOON_DIR : AFTER_NOON_DIR;
}

export async function runJob39(): Promise<string> {
  const targetDir = selectTargetDirectory();
  const today = new Date();

  const missing: string[] = [];

  // 🎯 2万件のディレクトリ走査をスキップし、ピンポイントで2ファイルのみ判定
  for (const targetName of TARGET_FILES) {
    const filePath = path.join(targetDir, targetName);

    try {
      // ファイルの存在確認と情報取得を1回の通信で実行
      const stats = await fs.stat(filePath);

      // 本日の更新日時か判定
      if (!isSameDay(stats.mtime, today)) {
        missing.push(`${targetName} (更新日時が本日ではありません)`);
      }
    } catch {
      // ファイルが存在しない場合は stat が例外を投げる
      missing.push(`${targetName} (未存在)`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`NG: ${missing.join(", ")}`);
  }

  return "正常終了";
}
