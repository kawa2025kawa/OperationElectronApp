// electron/services/operation/jobs/scripts/job_34.ts
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";

const LOG_PATH = "\\\\192.88.1.220\\log\\SANSAN_TXT_LOAD.log";

// 「さんさん畑」直後のスペース表記揺れを回避するため後方キーワードで判定
const COMPLETE_MESSAGE = "売上取り込み処理を終了しました";

export async function runJob34(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyy/MM/dd");
  const outputLines: string[] = [];

  const addLine = (message: string = "") => {
    outputLines.push(message);
  };

  addLine(`==================================================`);
  addLine(` [Job34] さんさん畑 売上取り込みログ確認 (日付: ${today})`);
  addLine(`==================================================`);
  addLine(`▶ 監視ログファイル: ${LOG_PATH}`);

  if (!(await fs.pathExists(LOG_PATH))) {
    throw new Error(`ログファイルが存在しません: ${LOG_PATH}`);
  }

  // ログファイルの最終更新日時を取得
  const stat = await fs.stat(LOG_PATH);
  const formattedDate = format(stat.mtime, "yyyy/MM/dd HH:mm:ss");
  addLine(`   └ ファイル更新日時: ${formattedDate}`);
  addLine();

  const buffer = await fs.readFile(LOG_PATH);
  const text = iconv.decode(buffer, "Shift_JIS");

  const found = text
    .split(/\r?\n/)
    .reverse()
    .find((line) => line.includes(today) && line.includes(COMPLETE_MESSAGE));

  if (found) {
    addLine(`▶ 検出ログメッセージ:`);
    addLine(`   ${found.trim()}`);
    addLine(`--------------------------------------------------`);
    addLine(` [Job34] 正常終了 (終了ログ確認完了)`);
    addLine(`==================================================`);

    return outputLines.join("\n");
  }

  addLine(
    `❌ [検出失敗] 本日 (${today}) の売上取り込み終了ログが見つかりません。`,
  );
  addLine(`   └ 検索キーワード: "${COMPLETE_MESSAGE}"`);
  addLine(`--------------------------------------------------`);

  throw new Error(
    `本日の売上取り込み終了ログが見つかりません\n\n${outputLines.join("\n")}`,
  );
}
