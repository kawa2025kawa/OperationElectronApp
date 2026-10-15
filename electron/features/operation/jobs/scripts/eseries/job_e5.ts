import fs from "fs-extra";
import path from "node:path";
import iconv from "iconv-lite";
import { parseCsvLine } from "../helpers/shared/parseCsvLine";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

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

  if (path.extname(filePath).toLowerCase() !== ".csv") {
    throw new Error(
      `CSVファイル (.csv) のみ処理可能です。指定されたファイル: ${path.basename(filePath)}`,
    );
  }

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

  if (lines.length <= 1) {
    throw new Error("CSVに有効なデータ行がありません。");
  }

  const shapedRows = lines.slice(1).flatMap((line) => {
    const cols = parseCsvLine(line);

    if (cols.length < 11) {
      return [];
    }

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

  if (shapedRows.length === 0) {
    throw new Error("CSVに処理可能なデータ行がありません。");
  }

  return shapedRows;
}

export async function runJobE5(
  inputFilePath?: string | string[],
): Promise<string> {
  const logger = new JobLogger();

  try {
    const csvFilePath = resolveInputFilePath(inputFilePath);

    logger.log(`入力ファイル : ${csvFilePath}`);

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
    const decodedText = iconv.decode(rawBuffer, ENCODING);
    const shapedRows = transformCsv(decodedText);

    logger.log(`変換件数 : ${shapedRows.length}件`);

    const outputBuffer = iconv.encode(
      `${shapedRows.map((row) => row.join(",")).join("\n")}\n`,
      ENCODING,
    );

    await fs.ensureDir(OUTPUT_DIR);

    const outputPath1 = path.join(OUTPUT_DIR, OUTPUT_FILE1);
    const outputPath2 = path.join(OUTPUT_DIR, OUTPUT_FILE2);

    await Promise.all([
      fs.writeFile(outputPath1, outputBuffer),
      fs.writeFile(outputPath2, outputBuffer),
    ]);

    logger.log(`出力ファイル : ${outputPath1}`);
    logger.log(`出力ファイル : ${outputPath2}`);
    logger.complete("TENF0140変換完了");

    return "JACOS端末で「140」を送信して下さい";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw logger.fail(errorMessage);
  }
}
