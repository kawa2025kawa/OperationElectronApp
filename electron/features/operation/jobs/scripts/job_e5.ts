// electron/features/operation/jobs/scripts/job_e5.ts

import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { parseCsvLine } from "./helpers/shared/parseCsvLine";

const INPUT_FILE_NAME = "TENF0140.csv";
const OUTPUT_DIR = "\\\\C0088150\\nec\\ftp";
const OUTPUT_FILE1 = "TENF0140.dat";
const OUTPUT_FILE2 = "TENF0140.dmy";
const ENCODING = "Windows-31J";

/** 入力ファイルパスの検証と取得 */
function resolveInputFilePath(inputFilePath?: string | string[]): string {
  const filePaths = Array.isArray(inputFilePath)
    ? inputFilePath
    : inputFilePath
      ? [inputFilePath]
      : [];

  if (filePaths.length !== 1 || !filePaths[0]) {
    throw new Error(
      `処理対象のファイルは${INPUT_FILE_NAME}の1ファイルのみ指定してください。`,
    );
  }

  const filePath = filePaths[0];
  const fileName = path.basename(filePath);

  if (fileName !== INPUT_FILE_NAME) {
    throw new Error(
      `処理対象ファイルは${INPUT_FILE_NAME}のみです。指定されたファイル: ${fileName}`,
    );
  }

  return filePath;
}

function normalizeCode(value: string, digits: number): string {
  const text = value.trim();
  if (!text) return "";

  const number = Number(text);
  if (!Number.isFinite(number)) return text;

  return String(number).padStart(digits, "0");
}

function transformCsv(text: string): string[][] {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");

  if (lines.length <= 1) {
    throw new Error("CSVに有効なデータ行がありません。");
  }

  lines.shift();

  const shapedRows: string[][] = [];

  for (const line of lines) {
    const columns = parseCsvLine(line);
    if (columns.length < 11) continue;

    shapedRows.push([
      normalizeCode(columns[2], 2),
      normalizeCode(columns[6], 3),
      columns[8],
      columns[9],
      columns[10],
      columns[4],
      columns[5],
    ]);
  }

  if (shapedRows.length === 0) {
    throw new Error("CSVに処理可能なデータ行がありません。");
  }

  return shapedRows;
}

function createOutputBuffer(rows: string[][]): Buffer {
  const outputText = rows.map((row) => row.join(",")).join("\n") + "\n";
  return iconv.encode(outputText, ENCODING);
}

export async function runJobE5(
  inputFilePath?: string | string[],
): Promise<string> {
  const csvFilePath = resolveInputFilePath(inputFilePath);

  const stat = await fs.stat(csvFilePath);
  if (!stat.isFile()) {
    throw new Error(
      `処理対象のファイル (${INPUT_FILE_NAME}) がファイルではありません。`,
    );
  }
  if (stat.size === 0) {
    throw new Error(
      `処理対象のファイル (${INPUT_FILE_NAME}) が空 (0バイト) です。`,
    );
  }

  const rawBuffer = await fs.readFile(csvFilePath);
  const text = iconv.decode(rawBuffer, ENCODING);
  const shapedRows = transformCsv(text);
  const outputBuffer = createOutputBuffer(shapedRows);

  // 出力先フォルダの存在確認・作成（ネットワークパス対応）
  await fs.ensureDir(OUTPUT_DIR);

  const outputFilePath1 = path.join(OUTPUT_DIR, OUTPUT_FILE1);
  const outputFilePath2 = path.join(OUTPUT_DIR, OUTPUT_FILE2);

  await Promise.all([
    fs.writeFile(outputFilePath1, outputBuffer),
    fs.writeFile(outputFilePath2, outputBuffer),
  ]);

  return "JACOS端末で「140」を送信して下さい";
}
