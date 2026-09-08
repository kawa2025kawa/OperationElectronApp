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
  if (path.basename(filePath) !== INPUT_FILE_NAME) {
    throw new Error(
      `処理対象ファイルは${INPUT_FILE_NAME}のみです。指定されたファイル: ${path.basename(filePath)}`,
    );
  }
  return filePath;
}

function normalizeCode(value: string, digits: number): string {
  const text = value.trim();
  const num = Number(text);
  return text && Number.isFinite(num)
    ? String(num).padStart(digits, "0")
    : text;
}

function transformCsv(text: string): string[][] {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");
  if (lines.length <= 1) throw new Error("CSVに有効なデータ行がありません。");

  // ヘッダー除外後、11カラム以上の行のみを抽出・整形 (flatMapを活用)
  const shapedRows = lines.slice(1).flatMap((line) => {
    const cols = parseCsvLine(line);
    if (cols.length < 11) return [];
    return [
      [
        normalizeCode(cols[2], 2),
        normalizeCode(cols[6], 3),
        cols[8],
        cols[9],
        cols[10],
        cols[4],
        cols[5],
      ],
    ];
  });

  if (shapedRows.length === 0)
    throw new Error("CSVに処理可能なデータ行がありません。");
  return shapedRows;
}

export async function runJobE5(
  inputFilePath?: string | string[],
): Promise<string> {
  const csvFilePath = resolveInputFilePath(inputFilePath);

  const stat = await fs.stat(csvFilePath);
  if (!stat.isFile())
    throw new Error(
      `処理対象のファイル (${INPUT_FILE_NAME}) がファイルではありません。`,
    );
  if (stat.size === 0)
    throw new Error(
      `処理対象のファイル (${INPUT_FILE_NAME}) が空 (0バイト) です。`,
    );

  const rawBuffer = await fs.readFile(csvFilePath);
  const shapedRows = transformCsv(iconv.decode(rawBuffer, ENCODING));
  const outputBuffer = iconv.encode(
    shapedRows.map((row) => row.join(",")).join("\n") + "\n",
    ENCODING,
  );

  await fs.ensureDir(OUTPUT_DIR);
  await Promise.all([
    fs.writeFile(path.join(OUTPUT_DIR, OUTPUT_FILE1), outputBuffer),
    fs.writeFile(path.join(OUTPUT_DIR, OUTPUT_FILE2), outputBuffer),
  ]);

  return "JACOS端末で「140」を送信して下さい";
}
