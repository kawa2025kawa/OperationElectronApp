// electron/features/operation/jobs/scripts/job_56.ts

// 請求データファイル確認

import fs from "fs-extra";
import path from "path";
import iconv from "iconv-lite";
import { format } from "date-fns";

// 本番用パス
const TARGET_DIR = "\\\\172.25.101.51\\if\\WEB-SV\\RCV\\SV";
const ENCODING = "Windows-31J"; // Shift_JIS(CP932/Windows-31J) 互換指定
const MAX_BYTE_LENGTH = 256;
const CHAR_A_BYTE = 0x41; // ASCII/SJIS における 'A'

// 許可する文字パターン: 行末パディング(スペース/NBSP等)を除去後、半角 A, D, 0-9 のみ
const VALID_CHAR_REGEX = /^[AD0-9]+$/;

export async function runJob56(): Promise<string> {
  const now = new Date();
  const today = format(now, "yyyyMMdd");
  const filePrefix = `SEIKYUDT_${today}`;

  // 1. フォルダの存在確認
  if (!(await fs.pathExists(TARGET_DIR))) {
    throw new Error(`対象フォルダが存在しません: ${TARGET_DIR}`);
  }

  // 2. 対象ファイルの抽出
  const entries = await fs.readdir(TARGET_DIR, { withFileTypes: true });
  const targetFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.startsWith(filePrefix),
  );

  // 存在しない場合は正常終了
  if (targetFiles.length === 0) {
    return `対象ファイル (${filePrefix}*) なし`;
  }

  // 3. 各ファイルの検証
  const errorMessages: string[] = [];

  for (const fileEntry of targetFiles) {
    const fileName = fileEntry.name;
    const filePath = path.join(TARGET_DIR, fileName);

    const rawBuffer = await fs.readFile(filePath);
    const decodedText = iconv.decode(rawBuffer, ENCODING);

    const lines = decodedText.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 末尾の空行はチェック対象外
      if (i === lines.length - 1 && line.length === 0) continue;

      // 行末のパディング（半角スペース、全角スペース、NBSP / \u00A0等）を除去
      const trimmedLine = line.replace(/[\s\u00A0]+$/g, "");

      // チェック①: 許可文字（半角 'A', 'D', '0'～'9'）以外の文字が含まれていないか
      if (trimmedLine.length > 0 && !VALID_CHAR_REGEX.test(trimmedLine)) {
        errorMessages.push(
          `${fileName} (${lineNum}行目): 許可されていない文字が含まれています (半角 A, D, 0-9 のみ許可)。`,
        );
      }

      const lineBuffer = iconv.encode(line, ENCODING);

      // チェック②: 1行の最大長が256バイト以内か
      if (lineBuffer.length > MAX_BYTE_LENGTH) {
        errorMessages.push(
          `${fileName} (${lineNum}行目): 行の長さが256バイトを超えています (${lineBuffer.length}バイト)。`,
        );
      }

      // チェック③: 3バイト目以降（インデックス2以降）に "A" (0x41) が存在しないか
      if (lineBuffer.length >= 3) {
        const subBuffer = lineBuffer.subarray(2);
        if (subBuffer.includes(CHAR_A_BYTE)) {
          errorMessages.push(
            `${fileName} (${lineNum}行目): 3バイト目以降に "A" が存在します。`,
          );
        }
      }
    }
  }

  // 4. 検証結果の判定
  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join(" / "));
  }

  return `全ファイル (${targetFiles.length}件) の検証完了`;
}
