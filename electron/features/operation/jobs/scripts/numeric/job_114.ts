// electron/features/operation/jobs/scripts/job_114.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";

const LOG_DIR = "\\\\192.88.100.1\\diskD\\execute\\log";
const REQUIRED_KEYWORD = "READ=";

export async function runJob114(): Promise<string> {
  const now = new Date();
  const yymmdd = format(now, "yyMMdd");
  const todayFormatted = format(now, "yyyy/MM/dd");
  const outputLines: string[] = [];
  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [Job114] 自動発注6時00分件数確認 (日付: ${todayFormatted})`);
  addLine(`==================================================`);
  addLine(`▶ 監視フォルダ: ${LOG_DIR}`);

  if (!(await fs.pathExists(LOG_DIR))) {
    throw new Error(`対象ディレクトリが存在しません: ${LOG_DIR}`);
  }

  const files = await fs.readdir(LOG_DIR);
  const targetFile = files.find(
    (name) => name.startsWith(yymmdd) && name.includes("ORJH0010.log"),
  );

  if (!targetFile) {
    addLine(
      `❌ 本日の対象ログファイルが見つかりません (接頭辞: ${yymmdd}*_ORJH0010.log)`,
    );
    addLine(`--------------------------------------------------`);
    throw new Error(
      `本日の対象ファイルなし (${yymmdd})\n\n${outputLines.join("\n")}`,
    );
  }

  const filePath = path.join(LOG_DIR, targetFile);
  const stat = await fs.stat(filePath);
  const formattedDate = format(stat.mtime, "yyyy/MM/dd HH:mm:ss");

  addLine(`▶ 対象ファイル: ${targetFile}`);
  addLine(`   └ 更新日時: ${formattedDate}`);
  addLine();

  const buffer = await fs.readFile(filePath);
  const logText = iconv.decode(buffer, "Shift_JIS");

  const match = logText.match(/READ=([^\s\r\n,]+)/);
  if (match?.[1]) {
    const parsed = parseInt(match[1], 10);
    const countText = Number.isNaN(parsed)
      ? `${match[1]}件`
      : `${parsed.toLocaleString()}件`;

    addLine(`▶ 抽出結果: ${REQUIRED_KEYWORD}${match[1]} -> ${countText}`);
    addLine(`--------------------------------------------------`);
    addLine(` [Job114] 正常終了 (取得件数: ${countText})`);
    addLine(`==================================================`);

    return outputLines.join("\n");
  }

  addLine(
    `❌ ログ解析エラー: キーワード "${REQUIRED_KEYWORD}" が見つかりません`,
  );
  addLine(`--------------------------------------------------`);
  throw new Error(
    `エラー (${targetFile}): '${REQUIRED_KEYWORD}' が見つかりません\n\n${outputLines.join("\n")}`,
  );
}
