// electron/features/operation/jobs/scripts/eseries/job_e5.ts

import fs from "fs-extra";
import path from "node:path";
import iconv from "iconv-lite";

import { parseCsvLine } from "@electron/features/operation/jobs/scripts/helpers/csvUtils";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const INPUT_FILE_NAME = "TENF0140.csv";
const OUTPUT_DIR = "\\\\C0088150\\nec\\ftp";
const OUTPUT_FILES = ["TENF0140.dat", "TENF0140.dmy"] as const;
const ENCODING = "Windows-31J";

async function resolveInputFilePath(
  inputFilePath?: string | string[],
): Promise<string> {
  const filePath = Array.isArray(inputFilePath)
    ? inputFilePath[0]
    : inputFilePath;

  if (
    !filePath ||
    (Array.isArray(inputFilePath) && inputFilePath.length !== 1) ||
    path.basename(filePath).toLowerCase() !== INPUT_FILE_NAME.toLowerCase() ||
    path.extname(filePath).toLowerCase() !== ".csv"
  ) {
    throw new Error(`${INPUT_FILE_NAME}の1ファイルのみ指定してください`);
  }

  return filePath;
}

function normalizeCode(value: string, digits: number): string {
  const text = value.trim();

  if (!text) {
    return text;
  }

  const number = Number(text);

  return Number.isFinite(number) ? String(number).padStart(digits, "0") : text;
}

function transformCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length <= 1) {
    throw new Error("CSVに有効なデータ行がありません。");
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
    throw new Error("CSVに処理可能なデータ行がありません。");
  }

  return rows;
}

async function readCsvRows(filePath: string): Promise<string[][]> {
  const buffer = await fs.readFile(filePath);
  return transformCsv(iconv.decode(buffer, ENCODING));
}

async function writeOutputFiles(rows: string[][]): Promise<string[]> {
  const outputText = `${rows.map((row) => row.join(",")).join("\r\n")}\r\n`;
  const outputBuffer = iconv.encode(outputText, ENCODING);

  await fs.ensureDir(OUTPUT_DIR);

  const outputPaths = OUTPUT_FILES.map((fileName) =>
    path.join(OUTPUT_DIR, fileName),
  );

  await fs.writeFile(outputPaths[0], outputBuffer);
  await fs.writeFile(outputPaths[1], outputBuffer);

  return outputPaths;
}
export async function runJobE5(
  inputFilePath?: string | string[],
): Promise<string> {
  const logger = new JobLogger();

  try {
    const csvFilePath = await resolveInputFilePath(inputFilePath);
    logger.log(`入力ファイル : ${csvFilePath}`);

    const rows = await readCsvRows(csvFilePath);
    const outputPaths = await writeOutputFiles(rows);

    for (const outputPath of outputPaths) {
      logger.log(`出力ファイル : ${outputPath}`);
    }
    return logger.complete("JACOS端末で「140」を送信して下さい");
  } catch (error: unknown) {
    throw logger.fail(error instanceof Error ? error.message : String(error));
  }
}
