// electron/features/operation/jobs/scripts/eseries/job_e41.ts

import path from "node:path";
import readline from "node:readline";
import fs from "fs-extra";
import { addDays, format } from "date-fns";

import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  resolveSingleInputFile,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";
import type { ScriptFilePath } from "@electron/features/operation/runners/scriptRunner";

const CONFIG = {
  host: NETWORK_HOSTS.C0088150,
  backupSubPaths: ["nec", "ftp", "GIFTSYS", "giftRecv", "BackUp"] as const,
  outputSubPaths: ["nec", "ftp", "GIFTSYS", "giftRecv"] as const,
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
- ギフトマスタエラーログからキーワードを抽出し、最新バックアップから対象行を翌日付で再作成する。
 */
export async function runJobE41(filePath?: ScriptFilePath): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const inputFilePath = await resolveSingleInputFile(filePath);
    const result = await processGiftMasterError(inputFilePath);
    return writeResultLog(logger, result);
  });
}

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

async function findLatestBackupFile(backupDir: string): Promise<string> {
  let backupFiles: string[];
  try {
    backupFiles = await withNetworkAuthRetry(backupDir, () =>
      fs.readdir(backupDir),
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      throw new Error(`バックアップフォルダが存在しません: ${backupDir}`);
    }
    throw error;
  }

  let latestFile = "";
  let latestMtime = new Date(0);

  for (const file of backupFiles) {
    if (!file.toUpperCase().includes(CONFIG.backupFileKeyword)) continue;

    const fullPath = path.join(backupDir, file);
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

async function processGiftMasterError(
  inputFilePath: string,
): Promise<JobResultData> {
  const backupDir = getNetworkHostPath(CONFIG.host, ...CONFIG.backupSubPaths);
  const outputDir = getNetworkHostPath(CONFIG.host, ...CONFIG.outputSubPaths);

  const keywordSet = await extractKeywords(inputFilePath);
  const backupFilePath = await findLatestBackupFile(backupDir);

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

  await withNetworkAuthRetry(outputDir, () => fs.ensureDir(outputDir));

  const now = new Date();
  const timestamp = format(now, "yyyyMMdd_HHmmss");
  const tomorrowStr = format(addDays(now, 1), "yyyyMMdd");
  const outFileName = `${CONFIG.outputFilePrefix}${timestamp}.DAT`;
  const outputFilePath = path.join(outputDir, outFileName);

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
