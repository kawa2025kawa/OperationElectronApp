// electron/features/operation/jobs/scripts/eseries/job_e41.ts

import path from "node:path";
import readline from "node:readline";
import fs from "fs-extra";
import { addDays, format } from "date-fns";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";
import type { ScriptFilePath } from "@shared/types/operation/operationTypes";

const CONFIG = {
  backupPath: "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\BackUp\\",
  outputPath: "\\\\C0088150\\nec\\ftp\\GIFTSYS\\giftRecv\\",
  errorPrefix: "マスタ情報獲得エラー :",
  backupFileKeyword: "GIFTDEN111",
  outputFilePrefix: "GIFTDEN111_",
  completionMessage: "マスタ情報の抽出完了",
} as const;

type JobResultData = {
  inputFilePath: string;
  backupFilePath: string;
  outputFilePath: string;
  keywordCount: number;
  extractedCount: number;
};

/**
 * ギフトマスタエラーログからキーワードを抽出し、最新バックアップから対象行を翌日付で再作成する。
 *
 * 入力ファイル:
 * - エラーログテキストファイル (1ファイルのみ)
 *
 * 参照先:
 * - \\C0088150\nec\ftp\GIFTSYS\giftRecv\BackUp (最新の GIFTDEN111 ファイル)
 *
 * 出力先:
 * - \\C0088150\nec\ftp\GIFTSYS\giftRecv\GIFTDEN111_YYYYMMDD_HHmmss.DAT
 *
 * 業務上の要対応:
 * - なし（正常完了後、抽出・作成結果をログ出力）
 *
 * システムエラー:
 * - 入力ファイル未指定・複数指定・不在
 * - 対象キーワード未検出
 * - バックアップフォルダまたはバックアップファイル不在
 * - ファイル読み書き失敗
 */
export async function runJobE41(filePath?: ScriptFilePath): Promise<string> {
  const logger = new JobLogger();

  try {
    const inputFilePath = await resolveSingleFilePath(filePath);
    const result = await processGiftMasterError(inputFilePath);

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`ファイル処理に失敗しました${detail}`);
  }
}

/**
 * 入力ファイルパスを検証・解決する。
 */
async function resolveSingleFilePath(
  filePath?: ScriptFilePath,
): Promise<string> {
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

  const targetPath = filePaths[0];
  if (!(await fs.pathExists(targetPath))) {
    throw new Error(`指定されたファイルが存在しません: ${targetPath}`);
  }

  return targetPath;
}

/**
 * エラーログから検索キーワード（11〜15桁目の4文字）を抽出する。
 */
async function extractKeywords(filePath: string): Promise<Set<string>> {
  const keywordSet = new Set<string>();
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (let line of rl) {
    if (!line.includes(CONFIG.errorPrefix)) continue;

    line = line.replace(CONFIG.errorPrefix, "").trim();
    const cleanedLine = line.replace(/\s+/g, "");

    if (cleanedLine.length >= 15) {
      keywordSet.add(cleanedLine.substring(11, 15));
    }
  }

  if (keywordSet.size === 0) {
    throw new Error("ファイルから対象キーワードが見つかりませんでした。");
  }

  return keywordSet;
}

/**
 * バックアップフォルダから最新の GIFTDEN111 ファイルを探索する。
 */
async function findLatestBackupFile(): Promise<string> {
  if (!(await directoryExists(CONFIG.backupPath))) {
    throw new Error(`バックアップフォルダが存在しません: ${CONFIG.backupPath}`);
  }

  const backupFiles = await fs.readdir(CONFIG.backupPath);
  let latestFile = "";
  let latestMtime = new Date(0);

  for (const file of backupFiles) {
    if (!file.toUpperCase().includes(CONFIG.backupFileKeyword)) continue;

    const fullPath = path.join(CONFIG.backupPath, file);
    const stat = await fs.stat(fullPath);

    if (stat.isFile() && stat.mtime > latestMtime) {
      latestMtime = stat.mtime;
      latestFile = fullPath;
    }
  }

  if (!latestFile) {
    throw new Error(
      `バックアップフォルダ内に${CONFIG.backupFileKeyword}ファイルが見つかりません。`,
    );
  }

  return latestFile;
}

/**
 * バックアップからキーワード一致行を抽出し、翌日付に置換してファイルを出力する。
 */
async function processGiftMasterError(
  inputFilePath: string,
): Promise<JobResultData> {
  const keywordSet = await extractKeywords(inputFilePath);
  const backupFilePath = await findLatestBackupFile();

  const matchedLines: string[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(backupFilePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const cleanedLine = line.replace(/\s+/g, "");
    if (cleanedLine.length < 15) continue;

    const keyword = cleanedLine.substring(11, 15);
    if (keywordSet.has(keyword)) {
      matchedLines.push(line);
    }
  }

  await fs.ensureDir(CONFIG.outputPath);

  const now = new Date();
  const timestamp = format(now, "yyyyMMdd_HHmmss");
  const tomorrowStr = format(addDays(now, 1), "yyyyMMdd");
  const outFileName = `${CONFIG.outputFilePrefix}${timestamp}.DAT`;
  const outputFilePath = path.join(CONFIG.outputPath, outFileName);

  const outputLines = matchedLines.map((line) =>
    line.length >= 8 ? tomorrowStr + line.substring(8) : line,
  );

  await fs.writeFile(outputFilePath, outputLines.join("\r\n") + "\r\n", "utf8");

  return {
    inputFilePath,
    backupFilePath,
    outputFilePath,
    keywordCount: keywordSet.size,
    extractedCount: matchedLines.length,
  };
}

/**
 * 処理結果をログに出力し、完了メッセージを返却する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  logger.section("入力ファイル");
  logger.log(result.inputFilePath);

  logger.section("参照バックアップ");
  logger.log(result.backupFilePath);

  logger.section("抽出結果");
  logger.log(`キーワード数 : ${result.keywordCount}件`);
  logger.log(`抽出レコード : ${result.extractedCount}件`);

  logger.section("出力ファイル");
  logger.log(result.outputFilePath);

  return logger.complete(CONFIG.completionMessage);
}
