// electron/services/operation/jobs/scripts/job_e5.ts

import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";

const INPUT_FILE_NAME = "TENF0140.csv";
const OUTPUT_FILE1 = "TENF0140.dat";
const OUTPUT_FILE2 = "TENF0140.dmy";
const ENCODING = "Windows-31J";

function resolveInputFilePath(inputFilePath?: string | string[]): string {
  if (!inputFilePath) {
    throw new Error(
      "処理対象のファイルが指定されていません。TENF0140.csvを1ファイル指定してください。",
    );
  }

  const filePaths = Array.isArray(inputFilePath)
    ? inputFilePath
    : [inputFilePath];

  if (filePaths.length !== 1) {
    throw new Error(
      "処理対象のファイルはTENF0140.csvの1ファイルのみ指定してください。",
    );
  }

  const filePath = filePaths[0];

  if (!filePath) {
    throw new Error(
      "処理対象のファイルが指定されていません。TENF0140.csvを指定してください。",
    );
  }

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

  if (!text) {
    return "";
  }

  const number = Number(text);

  if (!Number.isFinite(number)) {
    return text;
  }

  return String(number).padStart(digits, "0");
}

function parseCsvLine(line: string): string[] {
  const columns: string[] = [];

  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index++;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      columns.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  columns.push(current.trim());

  return columns;
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

    if (columns.length < 11) {
      continue;
    }

    const deptCode = normalizeCode(columns[2], 2);
    const storeCode = normalizeCode(columns[6], 3);

    const startDate = columns[4];
    const endDate = columns[5];

    const value1 = columns[8];
    const value2 = columns[9];
    const value3 = columns[10];

    shapedRows.push([
      deptCode,
      storeCode,
      value1,
      value2,
      value3,
      startDate,
      endDate,
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

  const outputDirectory = path.dirname(csvFilePath);

  const outputFilePath1 = path.join(outputDirectory, OUTPUT_FILE1);

  const outputFilePath2 = path.join(outputDirectory, OUTPUT_FILE2);

  await Promise.all([
    fs.writeFile(outputFilePath1, outputBuffer),
    fs.writeFile(outputFilePath2, outputBuffer),
  ]);

  return "CSV加工正常終了";
}
