// electron/features/operation/jobs/scripts/numeric/job_56.ts

import { format } from "date-fns";
import fs from "fs-extra";
import path from "node:path";
import iconv from "iconv-lite";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";

const CONFIG = {
  targetDir: "\\\\172.25.101.51\\if\\WEB-SV\\RCV\\SV",
  encoding: "Windows-31J",
  maxByteLength: 256,
  charAByte: 0x41,
  validCharRegex: /^[AD0-9 ]+$/,
} as const;

// timeUtils の getDateKey をローカル実装
function getDateKey(date = new Date()): string {
  return format(date, "yyyyMMdd");
}

// folderUtils の directoryExists をローカル実装
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    return (await fs.stat(dirPath)).isDirectory();
  } catch {
    return false;
  }
}

// fileUtils の findFiles をローカル実装
async function findFiles(
  dirPath: string,
  options: { prefix?: string; suffix?: string; includes?: string[] } = {},
): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const includes = options.includes ?? [];

  return entries
    .filter((entry) => {
      if (!entry.isFile()) return false;
      if (options.prefix && !entry.name.startsWith(options.prefix)) {
        return false;
      }
      if (options.suffix && !entry.name.endsWith(options.suffix)) {
        return false;
      }
      return includes.every((keyword) => entry.name.includes(keyword));
    })
    .map((entry) => path.join(dirPath, entry.name));
}

// fileUtils の getFileInfo をローカル実装
async function getFileInfo(filePath: string): Promise<{
  fileName: string;
  mtime: Date;
}> {
  const stats = await fs.stat(filePath);

  return {
    fileName: path.basename(filePath),
    mtime: stats.mtime,
  };
}

function validateLine(
  line: string,
  fileName: string,
  lineNum: number,
): string[] {
  const errors: string[] = [];
  const trimmed = line.replace(/[\s\u00A0]+$/g, "");

  if (trimmed.length > 0 && !CONFIG.validCharRegex.test(trimmed)) {
    errors.push(
      `${fileName} (${lineNum}行目): A, D, 0-9, 半角スペース以外の文字が含まれています`,
    );
  }

  const lineBuf = iconv.encode(line, CONFIG.encoding);

  if (lineBuf.length > CONFIG.maxByteLength) {
    errors.push(
      `${fileName} (${lineNum}行目): レコード長超過 (${lineBuf.length}バイト / 最大256バイト)`,
    );
  }

  if (lineBuf.length >= 3 && lineBuf.subarray(2).includes(CONFIG.charAByte)) {
    errors.push(
      `${fileName} (${lineNum}行目): 3バイト目以降に "A" が含まれています`,
    );
  }

  return errors;
}

async function validateFile(filePath: string): Promise<{
  fileName: string;
  errors: string[];
  lineCount: number;
  mtime: Date;
}> {
  const [fileInfo, rawBuf] = await Promise.all([
    getFileInfo(filePath),
    fs.readFile(filePath),
  ]);

  const lines = iconv.decode(rawBuf, CONFIG.encoding).split(/\r?\n/);

  const errors = lines.flatMap((line, index) => {
    if (index === lines.length - 1 && line.length === 0) {
      return [];
    }

    return validateLine(line, fileInfo.fileName, index + 1);
  });

  return {
    fileName: fileInfo.fileName,
    errors,
    lineCount: lines.length,
    mtime: fileInfo.mtime,
  };
}

export async function runJob56(): Promise<string> {
  const today = getDateKey(new Date());
  const filePrefix = `SEIKYUDT_${today}`;
  const logger = new JobLogger();

  logger.log(`監視ディレクトリ : ${CONFIG.targetDir}`);
  logger.log(`検索対象プレフィックス : ${filePrefix}*`);

  if (!(await directoryExists(CONFIG.targetDir))) {
    throw logger.fail(`ディレクトリが存在しません: ${CONFIG.targetDir}`);
  }

  const targetFiles = await findFiles(CONFIG.targetDir, {
    prefix: filePrefix,
  });

  if (targetFiles.length === 0) {
    logger.log(`対象ファイルなし (${filePrefix}*)`);
    return logger.complete("対象ファイルなし");
  }

  logger.log(`検出ファイル数 : ${targetFiles.length} 件`);

  const results = await Promise.all(
    targetFiles.map((filePath) => validateFile(filePath)),
  );

  const allErrors: string[] = [];

  for (const item of results) {
    logger.log(`  ${item.fileName} (${item.lineCount} 行)`);
    logger.log(`    更新日時 : ${format(item.mtime, "yyyy/MM/dd HH:mm:ss")}`);

    if (item.errors.length > 0) {
      allErrors.push(...item.errors);

      for (const error of item.errors) {
        logger.log(`      [エラー] ${error}`);
      }
    }
  }

  if (allErrors.length > 0) {
    throw logger.fail(
      `データ不正 (${allErrors.length} 件のエラー):\n${allErrors.join("\n")}`,
    );
  }

  return logger.complete(`対象 ${targetFiles.length} ファイル検証完了`);
}
