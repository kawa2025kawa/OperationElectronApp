// electron/features/operation/jobs/scripts/job_80.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV\\SV";
const REQUIRED_FILES = ["Okurikomi_toMD_JIZEN", "htsf0060_JIZEN"] as const;

export async function runJob80(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const outputLines: string[] = [];
  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [Job80] BENIF2200 抽出ファイル存在確認 (日付: ${today})`);
  addLine(`==================================================`);
  addLine(`▶ 監視フォルダ: ${TARGET_DIR}`);
  addLine();

  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  const files = await fs.readdir(TARGET_DIR);

  // パターンA: 固定ファイル名の探索
  const fixedFiles = await Promise.all(
    REQUIRED_FILES.map(async (target) => {
      const matched = files.find((file) => file.startsWith(target));
      if (!matched) return null;
      const stat = await fs.stat(path.join(TARGET_DIR, matched));
      return { target, fileName: matched, mtime: stat.mtime };
    }),
  );

  const hasAllFixed = fixedFiles.every((item) => item !== null);

  if (hasAllFixed) {
    addLine(`▶ [パターンA: 固定ファイル名] 全対象検出完了`);
    for (const item of fixedFiles) {
      if (item) {
        const formattedDate = format(item.mtime, "yyyy/MM/dd HH:mm:ss");
        addLine(`   ├ ${item.fileName}`);
        addLine(`   └ 更新日時: ${formattedDate}`);
      }
    }
    addLine(`--------------------------------------------------`);
    addLine(` [Job80] 正常終了 (2ファイル受信完了)`);
    addLine(`==================================================`);
    return outputLines.join("\n");
  }

  // パターンB: 日付付きファイル名の探索
  addLine(
    `⚠️ 固定ファイル未検出のため、日付付きファイル (${today}) を探索します...`,
  );

  const datedFiles = await Promise.all(
    REQUIRED_FILES.map(async (target) => {
      const pattern = `${target}_${today}`;
      const matched = files.find((file) => file.startsWith(pattern));
      if (!matched) return null;
      const stat = await fs.stat(path.join(TARGET_DIR, matched));
      return { target, fileName: matched, mtime: stat.mtime };
    }),
  );

  const missing: string[] = [];

  for (let i = 0; i < REQUIRED_FILES.length; i++) {
    const target = REQUIRED_FILES[i];
    const item = datedFiles[i];

    if (item) {
      const formattedDate = format(item.mtime, "yyyy/MM/dd HH:mm:ss");
      addLine(`▶ [パターンB: 日付付き] 検出: ${item.fileName}`);
      addLine(`   └ 更新日時: ${formattedDate}`);
    } else {
      missing.push(target);
      addLine(
        `❌ [キーワード: ${target}] 未存在 (固定 / 日付付きともに見つかりません)`,
      );
    }
  }

  addLine(`--------------------------------------------------`);

  if (missing.length > 0) {
    throw new Error(
      `欠損ファイル: ${missing.join(", ")}\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(` [Job80] 正常終了 (2ファイル受信完了)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
