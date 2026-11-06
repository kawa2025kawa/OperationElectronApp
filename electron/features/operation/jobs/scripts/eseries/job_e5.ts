// electron/features/operation/jobs/scripts/eseries/job_e5.ts

import fs from "fs-extra";
import path from "node:path";
import iconv from "iconv-lite";

import { parseCsvLine } from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  inputFileName: "TENF0140.csv",
  outputDir: "\\\\C0088150\\nec\\ftp",
  outputFiles: ["TENF0140.dat", "TENF0140.dmy"] as const,
  encoding: "Windows-31J",
  completionMessage: "JACOS端末で「140」を送信して下さい",
} as const;

type JobResultData = {
  inputFilePath: string;
  outputPaths: string[];
  businessErrorMessage?: string;
};

/**
 * TENF0140.csv を加工し、TENF0140.dat / TENF0140.dmy を生成・配置する。
 *
 * 業務上の要対応:
 * - 入力ファイルが不正（ファイル名不一致、複数指定など）
 * - CSV 内に有効なデータ行が存在しない
 *
 * システムエラー:
 * - ファイル読み込み・書き込み失敗
 */
export async function runJobE5(
  inputFilePath?: string | string[],
): Promise<string> {
  const logger = new JobLogger();

  try {
    const result = await processCostCsv(inputFilePath);

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
function resolveInputFilePath(inputFilePath?: string | string[]): {
  filePath: string | null;
  error?: string;
} {
  const filePath = Array.isArray(inputFilePath)
    ? inputFilePath[0]
    : inputFilePath;

  if (
    !filePath ||
    (Array.isArray(inputFilePath) && inputFilePath.length !== 1) ||
    path.basename(filePath).toLowerCase() !==
      CONFIG.inputFileName.toLowerCase() ||
    path.extname(filePath).toLowerCase() !== ".csv"
  ) {
    return {
      filePath: null,
      error: `${CONFIG.inputFileName}の1ファイルのみ指定してください`,
    };
  }

  return { filePath };
}

function normalizeCode(value: string, digits: number): string {
  const text = value.trim();

  if (!text) {
    return text;
  }

  const number = Number(text);

  return Number.isFinite(number) ? String(number).padStart(digits, "0") : text;
}

/**
 * CSV テキストをパース・変換する。
 */
function transformCsv(text: string): { rows: string[][]; error?: string } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length <= 1) {
    return { rows: [], error: "CSVに有効なデータ行がありません。" };
  }

  const rows: string[][] = [];

  for (const line of lines.slice(1)) {
    const columns = parseCsvLine(line);

    if (columns.length < 11) {
      continue;
    }

    rows.push([
      normalizeCode(columns[2], 2),
      normalizeCode(columns[6], 3),
      columns[8],
      columns[9],
      columns[10],
      columns[4],
      columns[5],
    ]);
  }

  if (rows.length === 0) {
    return { rows: [], error: "CSVに処理可能なデータ行がありません。" };
  }

  return { rows };
}

/**
 * 出力先フォルダの作成とデータ書き込みを実行する。
 */
async function writeOutputFiles(rows: string[][]): Promise<string[]> {
  const outputText = `${rows.map((row) => row.join(",")).join("\r\n")}\r\n`;
  const outputBuffer = iconv.encode(outputText, CONFIG.encoding);

  await fs.ensureDir(CONFIG.outputDir);

  const outputPaths = CONFIG.outputFiles.map((fileName) =>
    path.join(CONFIG.outputDir, fileName),
  );

  await fs.writeFile(outputPaths[0], outputBuffer);
  await fs.writeFile(outputPaths[1], outputBuffer);

  return outputPaths;
}

/**
 * CSV の読み込みとファイル変換を実行する。
 */
async function processCostCsv(
  inputFilePath?: string | string[],
): Promise<JobResultData> {
  const resolved = resolveInputFilePath(inputFilePath);
  if (!resolved.filePath) {
    return {
      inputFilePath: "",
      outputPaths: [],
      businessErrorMessage: resolved.error,
    };
  }

  const buffer = await fs.readFile(resolved.filePath);
  const { rows, error } = transformCsv(iconv.decode(buffer, CONFIG.encoding));

  if (error || rows.length === 0) {
    return {
      inputFilePath: resolved.filePath,
      outputPaths: [],
      businessErrorMessage: error ?? "データがありません",
    };
  }

  const outputPaths = await writeOutputFiles(rows);

  return {
    inputFilePath: resolved.filePath,
    outputPaths,
  };
}

/**
 * 結果をログに出力し、ステータスを返却する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): string {
  if (result.businessErrorMessage) {
    if (result.inputFilePath) {
      logger.log(`入力ファイル : ${result.inputFilePath}`);
    }
    return logger.needsAction(result.businessErrorMessage);
  }

  logger.log(`入力ファイル : ${result.inputFilePath}`);
  for (const outputPath of result.outputPaths) {
    logger.log(`出力ファイル : ${outputPath}`);
  }

  return logger.complete(CONFIG.completionMessage);
}
