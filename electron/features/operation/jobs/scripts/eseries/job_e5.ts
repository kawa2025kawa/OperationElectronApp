// electron/features/operation/jobs/scripts/eseries/job_e5.ts

import fs from "fs-extra";
import path from "node:path";
import iconv from "iconv-lite";

import {
  NETWORK_HOSTS,
  getNetworkHostPath,
} from "@electron/features/system/credentialStore";
import { readParsedCsv } from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import {
  resolveInputPaths,
  runJobWithLogger,
} from "@electron/features/operation/jobs/scripts/helpers/jobRunnerHelper";
import { withNetworkAuthRetry } from "@electron/features/operation/jobs/scripts/helpers/networkAuthHelper";

const CONFIG = {
  inputFileName: "TENF0140.csv",
  host: NETWORK_HOSTS.C0088150,
  outputSubPaths: ["nec", "ftp"] as const,
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
 */
export async function runJobE5(
  inputFilePath?: string | string[],
): Promise<string> {
  return runJobWithLogger("ファイル処理に失敗しました", async (logger) => {
    const result = await processCostCsv(inputFilePath);
    return writeResultLog(logger, result);
  });
}

function resolveInputFilePath(inputFilePath?: string | string[]): {
  filePath: string | null;
  error?: string;
} {
  const paths = resolveInputPaths(inputFilePath);
  const filePath = paths.length === 1 ? paths[0] : undefined;

  if (
    !filePath ||
    path.basename(filePath).toLowerCase() !==
      CONFIG.inputFileName.toLowerCase()
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

function transformRows(parsedRows: string[][]): {
  rows: string[][];
  error?: string;
} {
  if (parsedRows.length <= 1) {
    return { rows: [], error: "CSVに有効なデータ行がありません。" };
  }

  const rows: string[][] = [];

  for (const columns of parsedRows.slice(1)) {
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

async function writeOutputFiles(rows: string[][]): Promise<string[]> {
  const outputDir = getNetworkHostPath(CONFIG.host, ...CONFIG.outputSubPaths);
  const outputText = `${rows.map((row) => row.join(",")).join("\r\n")}\r\n`;
  const outputBuffer = iconv.encode(outputText, CONFIG.encoding);

  await withNetworkAuthRetry(outputDir, () => fs.ensureDir(outputDir));

  const outputPaths = CONFIG.outputFiles.map((fileName) =>
    path.join(outputDir, fileName),
  );

  await Promise.all(
    outputPaths.map((outputPath) => fs.writeFile(outputPath, outputBuffer)),
  );

  return outputPaths;
}

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

  const parsedRows = await readParsedCsv(resolved.filePath, CONFIG.encoding);
  const { rows, error } = transformRows(parsedRows);

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