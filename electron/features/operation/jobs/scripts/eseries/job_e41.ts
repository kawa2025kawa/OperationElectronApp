import path from "node:path";
import readline from "node:readline";
import fs from "fs-extra";
import { addDays, format } from "date-fns";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

type ScriptFilePath = string | string[];

const BACKUP_PATH = "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\BackUp\\";
const OUTPUT_PATH = "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\";
const ERROR_PREFIX = "マスタ情報獲得エラー :";

export async function runJobE41(filePath?: ScriptFilePath): Promise<string> {
  const logger = new JobLogger();

  try {
    if (!filePath) {
      throw new Error(
        "ファイルが指定されていません。ファイルをドロップしてください。",
      );
    }

    if (Array.isArray(filePath) && filePath.length > 1) {
      throw new Error("ファイルは1つだけ指定してください。");
    }

    const targetFilePath = Array.isArray(filePath) ? filePath[0] : filePath;

    if (!(await fs.pathExists(targetFilePath))) {
      throw new Error(`指定されたファイルが存在しません: ${targetFilePath}`);
    }

    logger.log(`入力ファイル : ${targetFilePath}`);

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

    if (!(await fs.pathExists(BACKUP_PATH))) {
      throw new Error(`バックアップフォルダが存在しません: ${BACKUP_PATH}`);
    }

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
