// electron/services/operation/jobs/scripts/job_39.ts

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "fs-extra";
import { format, isSameDay } from "date-fns";

const execFileAsync = promisify(execFile);

const BEFORE_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const AFTER_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";

const TARGET_FILES = ["Okurikomi_toMD.dat", "htsf0060"] as const;

/**
 * Windows コマンド（dir /b）を使ってネットワーク共有フォルダ内の該当ファイルを高速検索
 */
async function hasFileWithPattern(
  dirPath: string,
  prefix: string,
  dateStr: string,
): Promise<boolean> {
  const searchPattern = `${prefix}_${dateStr}*`;
  try {
    const { stdout } = await execFileAsync("cmd.exe", [
      "/c",
      "dir",
      "/b",
      path.join(dirPath, searchPattern),
    ]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function runJob39(): Promise<string> {
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const todayStr = format(now, "yyyyMMdd");

  const missing: string[] = [];

  if (isBeforeNoon) {
    // ----------------------------------------------------
    // 午前（12時前）: 固定ファイル名の存在・更新日チェック
    // ----------------------------------------------------
    for (const targetName of TARGET_FILES) {
      const filePath = path.join(BEFORE_NOON_DIR, targetName);
      try {
        const stats = await fs.stat(filePath);
        if (!isSameDay(stats.mtime, now)) {
          missing.push(`${targetName} (更新日時が本日ではありません)`);
        }
      } catch {
        missing.push(`${targetName} (未存在)`);
      }
    }
  } else {
    // ----------------------------------------------------
    // 午後（12時以降）: 2万件のフォルダから `プレフィックス_YYYYMMDD` で高速検索
    // ----------------------------------------------------
    for (const targetName of TARGET_FILES) {
      const exists = await hasFileWithPattern(
        AFTER_NOON_DIR,
        targetName,
        todayStr,
      );
      if (!exists) {
        missing.push(`${targetName}_${todayStr}* (未存在)`);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`NG: ${missing.join(", ")}`);
  }

  return "正常終了";
}
