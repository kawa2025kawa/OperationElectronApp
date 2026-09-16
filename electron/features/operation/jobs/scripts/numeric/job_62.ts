// electron/services/operation/jobs/scripts/job_62.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";

const TARGET_DIR = "\\\\172.25.101.51\\if\\MASTER\\RCV";
const EXPECTED_FILES = [
  { keyword: "htsf0060", count: 1 },
  { keyword: "Syohin_toMD_N", count: 4 },
  { keyword: "Tokusyo_toMD_N", count: 4 },
] as const;

export async function runJob62(): Promise<string> {
  const outputLines: string[] = [];
  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [Job62] 抽出ファイル件数一致確認`);
  addLine(`==================================================`);
  addLine(`▶ 監視フォルダ: ${TARGET_DIR}`);
  addLine();

  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`対象フォルダが見つかりません: ${TARGET_DIR}`);
  }

  const files = await fs.readdir(TARGET_DIR);
  const errorDetails: string[] = [];

  for (const rule of EXPECTED_FILES) {
    const foundNames = files.filter((f) => f.includes(rule.keyword));
    const isMatched = foundNames.length === rule.count;

    if (isMatched) {
      addLine(
        `▶ [${rule.keyword}] 検出成功 (件数: ${foundNames.length} / 期待: ${rule.count})`,
      );
      for (const name of foundNames) {
        const filePath = path.join(TARGET_DIR, name);
        const stat = await fs.stat(filePath);
        const formattedDate = format(stat.mtime, "yyyy/MM/dd HH:mm:ss");
        addLine(`   ├ ${name}`);
        addLine(`   └ 更新日時: ${formattedDate}`);
      }
    } else {
      errorDetails.push(
        `${rule.keyword} (期待数: ${rule.count}, 実際: ${foundNames.length})`,
      );
      addLine(
        `❌ [${rule.keyword}] 件数不一致 (期待数: ${rule.count} / 実際: ${foundNames.length})`,
      );
    }
    addLine();
  }

  addLine(`--------------------------------------------------`);

  if (errorDetails.length > 0) {
    throw new Error(
      `ファイル数不一致:\n${errorDetails.join("\n")}\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(` [Job62] 全ファイル数一致確認完了 (正常)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
