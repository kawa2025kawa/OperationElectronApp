// electron/features/operation/jobs/scripts/job_56.ts
import path from "node:path";
import { format } from "date-fns";
import fs from "fs-extra";
import iconv from "iconv-lite";

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
      `${fileName} (${lineNum}行目): 許可されていない文字が含まれています (半角 A, D, 0-9, 半角スペースのみ)`,
    );
  }

  const lineBuf = iconv.encode(line, ENCODING);
  if (lineBuf.length > MAX_BYTE_LENGTH) {
    errors.push(
      `${fileName} (${lineNum}行目): 行長超過 (${lineBuf.length}バイト / 制限 256バイト)`,
    );
  }

  if (lineBuf.length >= 3 && lineBuf.subarray(2).includes(CHAR_A_BYTE)) {
    errors.push(
      `${fileName} (${lineNum}行目): 3バイト目以降に "A" が存在します`,
    );
  }

  return errors;
}

async function validateFile(
  filePath: string,
  fileName: string,
): Promise<{ errors: string[]; lineCount: number; mtime: Date }> {
  const stat = await fs.stat(filePath);
  const rawBuf = await fs.readFile(filePath);
  const lines = iconv.decode(rawBuf, ENCODING).split(/\r?\n/);

  const errors = lines.flatMap((line, idx) => {
    if (idx === lines.length - 1 && line.length === 0) return [];
    return validateLine(line, fileName, idx + 1);
  });

  return { errors, lineCount: lines.length, mtime: stat.mtime };
}

export async function runJob56(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const filePrefix = `SEIKYUDT_${today}`;
  const outputLines: string[] = [];

  const addLine = (message: string = "") => outputLines.push(message);

  addLine(`==================================================`);
  addLine(` [Job56] 請求データフォーマット検証 (日付: ${today})`);
  addLine(`==================================================`);
  addLine(`▶ 監視フォルダ: ${TARGET_DIR}`);
  addLine(`▶ 対象接頭辞  : ${filePrefix}*`);
  addLine();

  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`対象フォルダが存在しません: ${TARGET_DIR}`);
  }

  const entries = await fs.readdir(TARGET_DIR, { withFileTypes: true });
  const targetFiles = entries.filter(
    (e) => e.isFile() && e.name.startsWith(filePrefix),
  );

  if (targetFiles.length === 0) {
    addLine(`▶ 対象ファイル (${filePrefix}*) は検出されませんでした。`);
    addLine(`--------------------------------------------------`);
    addLine(` [Job56] 処理対象なしで終了`);
    addLine(`==================================================`);
    return outputLines.join("\n");
  }

  addLine(`▶ 対象ファイル検出: 計 ${targetFiles.length} 件`);

  const results = await Promise.all(
    targetFiles.map(async (file) => {
      const filePath = path.join(TARGET_DIR, file.name);
      const res = await validateFile(filePath, file.name);
      return { fileName: file.name, ...res };
    }),
  );

  const allErrors: string[] = [];

  for (const item of results) {
    const formattedDate = format(item.mtime, "yyyy/MM/dd HH:mm:ss");
    addLine(`   ├ ${item.fileName} (${item.lineCount} 行)`);
    addLine(`   └ 更新日時: ${formattedDate}`);

    if (item.errors.length > 0) {
      allErrors.push(...item.errors);
      item.errors.forEach((err) => addLine(`      ❌ ${err}`));
    }
  }

  addLine(`--------------------------------------------------`);

  if (allErrors.length > 0) {
    throw new Error(
      `検証エラー発覚 (${allErrors.length}件):\n${allErrors.join("\n")}\n\n${outputLines.join("\n")}`,
    );
  }

  addLine(` [Job56] 全ファイル (${targetFiles.length}件) の検証完了 (正常)`);
  addLine(`==================================================`);

  return outputLines.join("\n");
}
