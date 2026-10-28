/**
 * electron/features/operation/jobs/scripts/numeric/job_56.ts
 */

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

type ValidationResult = {
  fileName: string;
  lineCount: number;
  mtime: Date;
  errors: string[];
};

function validateLine(
  line: string,
  fileName: string,
  lineNum: number,
): string[] {
  const errors: string[] = [];
  const trimmed = line.replace(/[\s\u00A0]+$/g, "");
  const lineBuffer = iconv.encode(line, CONFIG.encoding);

  if (trimmed.length > 0 && !CONFIG.validCharRegex.test(trimmed)) {
    errors.push(
      `${fileName} (${lineNum}行目): A, D, 0-9, 半角スペース以外の文字が含まれています`,
    );
  }

  if (lineBuffer.length > CONFIG.maxByteLength) {
    errors.push(
      `${fileName} (${lineNum}行目): レコード長超過 (${lineBuffer.length}バイト / 最大${CONFIG.maxByteLength}バイト)`,
    );
  }

  if (
    lineBuffer.length >= 3 &&
    lineBuffer.subarray(2).includes(CONFIG.charAByte)
  ) {
    errors.push(
      `${fileName} (${lineNum}行目): 3バイト目以降に "A" が含まれています`,
    );
  }

  return errors;
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  const [stats, buffer] = await Promise.all([
    fs.stat(filePath),
    fs.readFile(filePath),
  ]);
  const fileName = path.basename(filePath);
  const lines = iconv.decode(buffer, CONFIG.encoding).split(/\r?\n/);

  return {
    fileName,
    lineCount: lines.length,
    mtime: stats.mtime,
    errors: lines.flatMap((line, index) =>
      index === lines.length - 1 && line.length === 0
        ? []
        : validateLine(line, fileName, index + 1),
    ),
  };
}

export async function runJob56(): Promise<string> {
  const logger = new JobLogger();
  const today = format(new Date(), "yyyyMMdd");
  const filePrefix = `SEIKYUDT_${today}`;

  logger.log(`監視ディレクトリ : ${CONFIG.targetDir}`);

  try {
    const dirStats = await fs.stat(CONFIG.targetDir);

    if (!dirStats.isDirectory()) {
      throw new Error(`ディレクトリではありません: ${CONFIG.targetDir}`);
    }

    const targetFiles = (
      await fs.readdir(CONFIG.targetDir, {
        withFileTypes: true,
      })
    )
      .filter((entry) => entry.isFile() && entry.name.startsWith(filePrefix))
      .map((entry) => path.join(CONFIG.targetDir, entry.name));

    if (targetFiles.length === 0) {
      logger.log(`対象ファイルなし (${filePrefix}*)`);
      return logger.complete();
    }

    logger.log(`検出ファイル数 : ${targetFiles.length} 件`);

    const results = await Promise.all(targetFiles.map(validateFile));
    const allErrors: string[] = [];

    for (const result of results) {
      logger.log(`${result.fileName}`);
      logger.log(
        `    更新日時 : ${format(result.mtime, "yyyy/MM/dd HH:mm:ss")}`,
      );

      result.errors.forEach((error) => {
        allErrors.push(error);
        logger.log(`      [エラー] ${error}`);
      });
    }

    return allErrors.length > 0
      ? logger.needsAction(
          `データ不正 (${allErrors.length} 件のエラー):\n${allErrors.join("\n")}`,
        )
      : logger.complete(`対象 ${targetFiles.length} ファイル検証完了`);
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? ` (${error.message})` : ` (${String(error)})`;

    throw logger.fail(`システムエラーが発生しました${detail}`);
  }
}
