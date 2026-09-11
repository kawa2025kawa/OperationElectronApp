// electron/features/operation/jobs/scripts/job_16.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";

const NORMAL_ERROR_PATH = "\\\\192.88.1.3\\syn_tran";
const FARMERS_ERROR_PATH = "\\\\192.88.1.3\\syn_tran\\ファーマーズエラー";
const TARGET_PREFIX = "SANSAN_ERROR_";

function selectTargetDirectory(): { dir: string; reason: string } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (hour < 8 || (hour === 8 && minute <= 30)) {
    return {
      dir: NORMAL_ERROR_PATH,
      reason: "8:30以前のため通常パスを参照",
    };
  }

  return {
    dir: FARMERS_ERROR_PATH,
    reason: "8:31以降のためファーマーズエラーパスを参照",
  };
}

export async function runJob16(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const targetPrefix = `${TARGET_PREFIX}${today}`;
  const { dir, reason } = selectTargetDirectory();
  const outputLines: string[] = [];

  const addLine = (message: string = "") => {
    outputLines.push(message);
  };

  addLine(`==================================================`);
  addLine(` [Job16] SANSAN エラーファイル存在チェック (日付: ${today})`);
  addLine(`==================================================`);
  addLine(`▶ 監視ディレクトリ: ${dir}`);
  addLine(`   └ 判定条件: ${reason}`);
  addLine(`▶ 接頭辞条件    : ${targetPrefix}*.txt`);
  addLine();

  if (!(await fs.pathExists(dir))) {
    throw new Error(`ディレクトリが存在しません: ${dir}`);
  }

  const files = await fs.readdir(dir);

  // 対象の ERROR ファイルを検索
  const targetFiles = files.filter(
    (file) => file.startsWith(targetPrefix) && file.endsWith(".txt"),
  );

  if (targetFiles.length > 0) {
    addLine(`❌ [エラーファイル検出] 計 ${targetFiles.length} 件`);

    for (const fileName of targetFiles) {
      const filePath = path.join(dir, fileName);
      const stat = await fs.stat(filePath);
      const formattedDate = format(stat.mtime, "yyyy/MM/dd HH:mm:ss");

      addLine(`   ├ ファイル  : ${fileName}`);
      addLine(`   └ 更新日時  : ${formattedDate}`);
    }

    addLine(`--------------------------------------------------`);
    throw new Error(
      `SANSANエラーファイルが存在します (${targetFiles.length}件)\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(`▶ 検出結果: 対象エラーファイルなし (正常)`);
  addLine(`--------------------------------------------------`);
  addLine(` [Job16] 正常終了`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
