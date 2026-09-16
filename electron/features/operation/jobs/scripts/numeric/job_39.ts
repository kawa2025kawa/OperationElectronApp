// electron/features/operation/jobs/scripts/job_39.ts
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { format, isSameDay } from "date-fns";
import fs from "fs-extra";

const execFileAsync = promisify(execFile);

const BEFORE_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const AFTER_NOON_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";
const TARGET_FILES = ["Okurikomi_toMD.dat", "htsf0060"] as const;

interface FileCheckDetail {
  targetName: string;
  foundName?: string;
  mtime?: Date;
  error?: string;
}

async function hasFileWithPattern(
  dirPath: string,
  prefix: string,
  dateStr: string,
): Promise<{ exists: boolean; matchedName?: string }> {
  try {
    const { stdout } = await execFileAsync("cmd.exe", [
      "/c",
      "dir",
      "/b",
      path.join(dirPath, `${prefix}_${dateStr}*`),
    ]);
    const matchedName = stdout.trim().split(/\r?\n/)[0];
    return { exists: !!matchedName, matchedName };
  } catch {
    return { exists: false };
  }
}

async function checkBeforeNoonFile(
  targetName: string,
  now: Date,
): Promise<FileCheckDetail> {
  const filePath = path.join(BEFORE_NOON_DIR, targetName);
  try {
    const stats = await fs.stat(filePath);
    if (!isSameDay(stats.mtime, now)) {
      return {
        targetName,
        mtime: stats.mtime,
        error: "更新日時が本日ではありません",
      };
    }
    return { targetName, foundName: targetName, mtime: stats.mtime };
  } catch {
    return { targetName, error: "未存在" };
  }
}

async function checkAfterNoonFile(
  targetName: string,
  todayStr: string,
): Promise<FileCheckDetail> {
  const { exists, matchedName } = await hasFileWithPattern(
    AFTER_NOON_DIR,
    targetName,
    todayStr,
  );

  if (!exists) {
    return { targetName, error: `${targetName}_${todayStr}* (未存在)` };
  }

  const filePath = path.join(AFTER_NOON_DIR, matchedName!);
  const stats = await fs.stat(filePath);

  return {
    targetName,
    foundName: matchedName,
    mtime: stats.mtime,
  };
}

export async function runJob39(): Promise<string> {
  const now = new Date();
  const isBeforeNoon = now.getHours() < 12;
  const todayStr = format(now, "yyyyMMdd");
  const targetDir = isBeforeNoon ? BEFORE_NOON_DIR : AFTER_NOON_DIR;
  const timePeriodText = isBeforeNoon ? "午前 (12時前)" : "午後 (12時以降)";

  const outputLines: string[] = [];
  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [Job39] 送込・マスターファイル存在チェック (日付: ${todayStr})`);
  addLine(`==================================================`);
  addLine(`▶ 判定区分: ${timePeriodText}`);
  addLine(`▶ 監視フォルダ: ${targetDir}`);
  addLine();

  const results = await Promise.all(
    TARGET_FILES.map((name) =>
      isBeforeNoon
        ? checkBeforeNoonFile(name, now)
        : checkAfterNoonFile(name, todayStr),
    ),
  );

  const errors: string[] = [];

  for (const item of results) {
    if (item.error) {
      errors.push(`${item.targetName} (${item.error})`);
      addLine(`❌ [${item.targetName}] 不備検出: ${item.error}`);
    } else {
      const dateText = item.mtime
        ? format(item.mtime, "yyyy/MM/dd HH:mm:ss")
        : "-";
      addLine(`▶ [${item.targetName}] 検出: ${item.foundName}`);
      addLine(`   └ 更新日時: ${dateText}`);
    }
  }

  addLine(`--------------------------------------------------`);

  if (errors.length > 0) {
    throw new Error(`NG: ${errors.join(", ")}\n\n${outputLines.join("\n")}`);
  }

  addLine(` [Job39] 正常終了 (全対象ファイル確認完了)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
