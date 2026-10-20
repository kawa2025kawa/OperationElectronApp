// electron/features/operation/jobs/scripts/eseries/job_e41.ts

import path from "node:path";
import readline from "node:readline";
import fs from "fs-extra";
import { addDays, format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

type ScriptFilePath = string | string[];

const BACKUP_PATH = "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\BackUp\\";
const OUTPUT_PATH = "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\";
const ERROR_PREFIX = "マスタ情報獲得エラー :";

// folderUtils の directoryExists をローカル関数として実装
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function resolveSingleFilePath(filePath?: ScriptFilePath): string {
  const filePaths = Array.isArray(filePath)
    ? filePath
    : filePath
      ? [filePath]
      : [];

  if (filePaths.length === 0) {
    throw new Error(
      "ファイルが指定されていません。ファイルをドロップしてください。",
    );
  }

  if (filePaths.length > 1) {
    throw new Error("ファイルは1つだけ指定してください。");
  }

  return filePaths[0];
}

export async function runJobE41(filePath?: ScriptFilePath): Promise<string> {
  const logger = new JobLogger();

  try {
    const targetFilePath = resolveSingleFilePath(filePath);

    if (!(await fs.pathExists(targetFilePath))) {
      throw new Error(`指定されたファイルが存在しません: ${targetFilePath}`);
    }

    logger.log(`入力ファイル : ${targetFilePath}`);

    // エラーログから検索キーワード（11〜15桁目の4文字）を抽出
    const keywordSet = new Set<string>();
    const rlError = readline.createInterface({
      input: fs.createReadStream(targetFilePath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    for await (let line of rlError) {
      if (!line.includes(ERROR_PREFIX)) continue;

      line = line.replace(ERROR_PREFIX, "").trim();
      const cleanedLine = line.replace(/\s+/g, "");

      if (cleanedLine.length >= 15) {
        keywordSet.add(cleanedLine.substring(11, 15));
      }
    }

    logger.log(`抽出キーワード数 : ${keywordSet.size}`);

    if (keywordSet.size === 0) {
      throw new Error("ファイルから対象キーワードが見つかりませんでした。");
    }

    if (!(await directoryExists(BACKUP_PATH))) {
      throw new Error(`バックアップフォルダが存在しません: ${BACKUP_PATH}`);
    }

    // バックアップフォルダから最新の GIFTDEN111 ファイルを取得
    const backupFiles = await fs.readdir(BACKUP_PATH);
    let latestFile = "";
    let latestMtime = new Date(0);

    for (const file of backupFiles) {
      if (!file.toUpperCase().includes("GIFTDEN111")) continue;

      const fullPath = path.join(BACKUP_PATH, file);
      const stat = await fs.stat(fullPath);

      if (stat.isFile() && stat.mtime > latestMtime) {
        latestMtime = stat.mtime;
        latestFile = fullPath;
      }
    }

    if (!latestFile) {
      throw new Error(
        "バックアップフォルダ内にGIFTDEN111ファイルが見つかりません。",
      );
    }

    logger.log(`参照バックアップ : ${latestFile}`);

    // バックアップファイルから対象キーワードが含まれる行を抽出
    const result: string[] = [];
    const rlBackup = readline.createInterface({
      input: fs.createReadStream(latestFile, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rlBackup) {
      const cleanedLine = line.replace(/\s+/g, "");

      if (cleanedLine.length < 15) continue;

      const keyword = cleanedLine.substring(11, 15);
      if (keywordSet.has(keyword)) {
        result.push(line);
      }
    }

    logger.log(`抽出件数 : ${result.length}`);

    await fs.ensureDir(OUTPUT_PATH);

    const now = new Date();
    const timestamp = format(now, "yyyyMMdd_HHmmss");
    const outFileName = `GIFTDEN111_${timestamp}.DAT`;
    const outFilePath = path.join(OUTPUT_PATH, outFileName);
    const tomorrowStr = format(addDays(now, 1), "yyyyMMdd");

    // 先頭8桁を明日の日付に置換して書き出し
    const outputLines = result.map((line) =>
      line.length >= 8 ? tomorrowStr + line.substring(8) : line,
    );

    await fs.writeFile(outFilePath, outputLines.join("\r\n") + "\r\n", "utf8");

    logger.log(`出力ファイル : ${outFilePath}`);
    logger.complete("マスタ情報の抽出完了");

    return (
      `処理が完了しました。\n` +
      `キーワード数 : ${keywordSet.size}\n` +
      `抽出件数 : ${result.length}\n` +
      `出力ファイル : ${outFilePath}`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}
