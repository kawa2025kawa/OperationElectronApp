// electron/features/operation/jobs/scripts/job_39.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "fs-extra";
import { format, isSameDay } from "date-fns";

const execFileAsync = promisify(execFile);

const BEFORE_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const AFTER_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";
const TARGET_FILES = ["Okurikomi_toMD.dat", "htsf0060"] as const;

async function hasFileWithPattern(
  dirPath: string,
  prefix: string,
  dateStr: string,
): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("cmd.exe", [
      "/c",
      "dir",
      "/b",
      path.join(dirPath, `${prefix}_${dateStr}*`),
    ]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function checkBeforeNoonFile(
  targetName: string,
  now: Date,
): Promise<string | null> {
  const filePath = path.join(BEFORE_NOON_DIR, targetName);
  try {
    const stats = await fs.stat(filePath);
    return isSameDay(stats.mtime, now)
      ? null
      : `${targetName} (更新日時が本日ではありません)`;
  } catch {
    return `${targetName} (未存在)`;
  }
}

async function checkAfterNoonFile(
  targetName: string,
  todayStr: string,
): Promise<string | null> {
  const exists = await hasFileWithPattern(AFTER_NOON_DIR, targetName, todayStr);
  return exists ? null : `${targetName}_${todayStr}* (未存在)`;
}

export async function runJob39(): Promise<string> {
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const todayStr = format(now, "yyyyMMdd");

  // Promise.all と map を使って各ファイルの並列チェック＆不備抽出 (filter)
  const results = await Promise.all(
    TARGET_FILES.map((name) =>
      isBeforeNoon
        ? checkBeforeNoonFile(name, now)
        : checkAfterNoonFile(name, todayStr),
    ),
  );

  const missing = results.filter((msg): msg is string => msg !== null);

  if (missing.length > 0) throw new Error(`NG: ${missing.join(", ")}`);
  return "正常終了";
}
