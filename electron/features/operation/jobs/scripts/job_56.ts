// electron/features/operation/jobs/scripts/job_56.ts
import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { format } from "date-fns";

const TARGET_DIR = "\\\\172.25.101.51\\if\\WEB-SV\\RCV\\SV";
const ENCODING = "Windows-31J";
const MAX_BYTE_LENGTH = 256;
const CHAR_A_BYTE = 0x41;
const VALID_CHAR_REGEX = /^[AD0-9 ]+$/;

function validateLine(
  line: string,
  fileName: string,
  lineNum: number,
): string[] {
  const errors: string[] = [];
  const trimmed = line.replace(/[\s\u00A0]+$/g, "");

  if (trimmed.length > 0 && !VALID_CHAR_REGEX.test(trimmed)) {
    errors.push(
      `${fileName} (${lineNum}行目): 許可されていない文字が含まれています (半角 A, D, 0-9, 半角スペースのみ許可)。`,
    );
  }

  const lineBuf = iconv.encode(line, ENCODING);
  if (lineBuf.length > MAX_BYTE_LENGTH) {
    errors.push(
      `${fileName} (${lineNum}行目): 行の長さが256バイトを超えています (${lineBuf.length}バイト)。`,
    );
  }

  if (lineBuf.length >= 3 && lineBuf.subarray(2).includes(CHAR_A_BYTE)) {
    errors.push(
      `${fileName} (${lineNum}行目): 3バイト目以降に "A" が存在します。`,
    );
  }

  return errors;
}

async function validateFile(
  filePath: string,
  fileName: string,
): Promise<string[]> {
  const rawBuf = await fs.readFile(filePath);
  const lines = iconv.decode(rawBuf, ENCODING).split(/\r?\n/);

  return lines.flatMap((line, idx) => {
    // 最終行の空行スキップ
    if (idx === lines.length - 1 && line.length === 0) return [];
    return validateLine(line, fileName, idx + 1);
  });
}

export async function runJob56(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const filePrefix = `SEIKYUDT_${today}`;

  if (!(await fs.pathExists(TARGET_DIR)))
    throw new Error(`対象フォルダが存在しません: ${TARGET_DIR}`);

  const entries = await fs.readdir(TARGET_DIR, { withFileTypes: true });
  const targetFiles = entries.filter(
    (e) => e.isFile() && e.name.startsWith(filePrefix),
  );

  if (targetFiles.length === 0) return `対象ファイル (${filePrefix}*) なし`;

  const errorMessages = (
    await Promise.all(
      targetFiles.map((file) =>
        validateFile(path.join(TARGET_DIR, file.name), file.name),
      ),
    )
  ).flat();

  if (errorMessages.length > 0) throw new Error(errorMessages.join(" / "));

  return `全ファイル (${targetFiles.length}件) の検証完了`;
}
