// electron/features/operation/jobs/scripts/job_20.ts
import path from "node:path";
import { format, subDays } from "date-fns";
import fs from "fs-extra";

const MAX_DIFF_KB = 10000.0;
const TARGET_DIR = "\\\\172.25.101.51\\if\\AUTOORD\\RCV\\SV";

interface TargetFileInfo {
  fileName: string;
  sizeKb: number;
  mtime: Date;
}

async function getTargetFileInfo(
  dir: string,
  dateKey: string,
): Promise<TargetFileInfo> {
  const files = await fs.readdir(dir);
  const targetFile = files.find(
    (file) => file.includes("JIDOHAT") && file.includes(dateKey),
  );

  if (!targetFile) {
    throw new Error(`対象ファイルが見つかりません (日付キー: ${dateKey})`);
  }

  const filePath = path.join(dir, targetFile);
  const stats = await fs.stat(filePath);

  return {
    fileName: targetFile,
    sizeKb: stats.size / 1024.0,
    mtime: stats.mtime,
  };
}

export async function runJob20(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyMMdd");
  const lastWeek = format(subDays(now, 7), "yyMMdd");
  const outputLines: string[] = [];

  const addLine = (message: string = "") => {
    outputLines.push(message);
  };

  addLine(`==================================================`);
  addLine(` [Job20] 自動発注ファイルサイズ比較チェック`);
  addLine(`==================================================`);

  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`ディレクトリが存在しません: ${TARGET_DIR}`);
  }

  let todayFile: TargetFileInfo;
  let lastWeekFile: TargetFileInfo;

  try {
    // 本日分ファイル取得
    todayFile = await getTargetFileInfo(TARGET_DIR, today);
    addLine(`▶ [本日 (${today})] 対象: ${todayFile.fileName}`);
    addLine(`   ├ サイズ  : ${todayFile.sizeKb.toFixed(2)} KB`);
    addLine(`   └ 更新日時: ${format(todayFile.mtime, "yyyy/MM/dd HH:mm:ss")}`);
    addLine();

    // 先週同日分ファイル取得
    lastWeekFile = await getTargetFileInfo(TARGET_DIR, lastWeek);
    addLine(`▶ [先週 (${lastWeek})] 対象: ${lastWeekFile.fileName}`);
    addLine(`   ├ サイズ  : ${lastWeekFile.sizeKb.toFixed(2)} KB`);
    addLine(
      `   └ 更新日時: ${format(lastWeekFile.mtime, "yyyy/MM/dd HH:mm:ss")}`,
    );
    addLine();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`${errorMessage}\n\n${outputLines.join("\n")}`);
  }

  // 差分計算
  const diffKb = Math.abs(todayFile.sizeKb - lastWeekFile.sizeKb);

  addLine(`--------------------------------------------------`);
  addLine(
    ` 📊 サイズ差異: ${diffKb.toFixed(2)} KB (許容閾値: ${MAX_DIFF_KB.toFixed(0)} KB)`,
  );
  addLine(`--------------------------------------------------`);

  if (diffKb > MAX_DIFF_KB) {
    throw new Error(
      `許容値超過: ${diffKb.toFixed(2)} KB 差分が発生しています (閾値: ${MAX_DIFF_KB.toFixed(0)} KB)\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(` [Job20] 正常終了 (判定: OK)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
