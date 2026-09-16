// electron\features\other\service\giftMdService.ts
import path from "node:path";
import readline from "node:readline";
import fs from "fs-extra";
import { addDays, format } from "date-fns";

type ScriptFilePath = string | string[];

//const BACKUP_PATH = "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\BackUp\\";
const BACKUP_PATH = "C:\\Users\\C3088091\\Desktop\\test\\giftRecv\\BackUp";

//const OUTPUT_PATH = "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\";
const OUTPUT_PATH = "C:\\Users\\C3088091\\Desktop\\test\\giftRecv";

const ERROR_PREFIX = "マスタ情報獲得エラー :";

export async function giftMdProcess(
  filePath?: ScriptFilePath,
): Promise<string> {
  // =====================================
  // 1. 入力ファイル検証 (DnDされたファイル)
  // =====================================
  if (!filePath) {
    throw new Error(
      "ファイルが指定されていません。ファイルをドロップしてください。",
    );
  }

  // 複数ドロップされた場合や配列で渡された場合のチェック
  const targetFilePath = Array.isArray(filePath) ? filePath[0] : filePath;

  if (Array.isArray(filePath) && filePath.length > 1) {
    throw new Error("ファイルは1つだけ指定してください。");
  }

  if (!(await fs.pathExists(targetFilePath))) {
    throw new Error(`指定されたファイルが存在しません: ${targetFilePath}`);
  }

  // =====================================
  // 2. エラーファイル読込（キーワード抽出）
  // =====================================
  const keywordSet = new Set<string>();

  const rlError = readline.createInterface({
    input: fs.createReadStream(targetFilePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (let line of rlError) {
    if (line.includes(ERROR_PREFIX)) {
      // プレフィックス除去とトリム
      line = line.replace(ERROR_PREFIX, "").trim();

      // 空白を除去して「20260731019841400001」形式に統一
      const cleanedLine = line.replace(/\s+/g, "");

      if (cleanedLine.length >= 15) {
        // VBA: Right$(Left$(line, 15), 4) -> 11文字目から15文字目（4文字）
        const keyword = cleanedLine.substring(11, 15);
        keywordSet.add(keyword);
      }
    }
  }

  if (keywordSet.size === 0) {
    throw new Error("ファイルから対象キーワードが見つかりませんでした。");
  }

  // =====================================
  // 3. 最新のGIFTDEN111ファイル取得
  // =====================================
  if (!(await fs.pathExists(BACKUP_PATH))) {
    throw new Error(`バックアップフォルダが存在しません: ${BACKUP_PATH}`);
  }

  const backupFiles = await fs.readdir(BACKUP_PATH);
  let latestFile = "";
  let latestMtime = new Date(0);

  for (const file of backupFiles) {
    if (file.toUpperCase().includes("GIFTDEN111")) {
      const fullPath = path.join(BACKUP_PATH, file);
      const stat = await fs.stat(fullPath);
      if (stat.isFile() && stat.mtime > latestMtime) {
        latestMtime = stat.mtime;
        latestFile = fullPath;
      }
    }
  }

  if (!latestFile) {
    throw new Error(
      "バックアップフォルダ内にGIFTDEN111ファイルが見つかりません。",
    );
  }

  // =====================================
  // 4. 最新ファイルから抽出
  // =====================================
  const result: string[] = [];

  const rlBackup = readline.createInterface({
    input: fs.createReadStream(latestFile, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rlBackup) {
    const cleanedLine = line.replace(/\s+/g, "");
    if (cleanedLine.length >= 15) {
      const keyword = cleanedLine.substring(11, 15);
      if (keywordSet.has(keyword)) {
        result.push(line);
      }
    }
  }

  // =====================================
  // 5. 出力
  // =====================================
  await fs.ensureDir(OUTPUT_PATH);

  const now = new Date();
  const timestamp = format(now, "yyyyMMdd_HHmmss");
  const outFileName = `GIFTDEN111_${timestamp}.DAT`;
  const outFilePath = path.join(OUTPUT_PATH, outFileName);

  const tomorrowStr = format(addDays(now, 1), "yyyyMMdd");

  // 出力用データ加工 (先頭8文字を翌日日付に置き換え)
  const outputLines = result.map((line) => {
    if (line.length >= 8) {
      return tomorrowStr + line.substring(8);
    }
    return line;
  });

  // 改行コード（CRLF）を付与してファイル書き込み
  await fs.writeFile(outFilePath, outputLines.join("\r\n") + "\r\n", "utf8");

  return (
    `処理が完了しました。\n` +
    `キーワード数 : ${keywordSet.size}\n` +
    `抽出件数 : ${result.length}\n` +
    `出力ファイル : ${outFilePath}`
  );
}
