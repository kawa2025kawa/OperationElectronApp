// electron/features/operation/jobs/scripts/job_e14.ts

import * as path from "path";
import fs from "fs-extra";
import { format, subMonths } from "date-fns";

import type { JobResult } from "@shared/types/operation";
import { compressFiles } from "./helpers/shared/zip-helper";

import {
  TANPIN_PREFIX,
  BUMON_PREFIX,
  TANPIN_OUTPUT_NAME,
  BUMON_OUTPUT_NAME,
  OUTPUT_FOLDER_SUFFIX,
} from "./helpers/job_e14/constants";

import { processTanpin } from "./helpers/job_e14/tanpin";
import { processBumon } from "./helpers/job_e14/bumon";

type E14FileType = "tanpin" | "bumon";

interface E14Output {
  fileType: E14FileType;
  inputPath: string;
  outputPath: string;
}

/**
 * 入力ファイルパスを配列へ正規化する。
 */
function normalizeInputPaths(inputFilePath?: string | string[]): string[] {
  if (!inputFilePath) {
    return [];
  }

  return Array.isArray(inputFilePath) ? inputFilePath : [inputFilePath];
}

/**
 * ファイル名からE14の処理対象を判定する。
 */
function getFileType(fileName: string): E14FileType | null {
  if (fileName.startsWith(TANPIN_PREFIX)) {
    return "tanpin";
  }

  if (fileName.startsWith(BUMON_PREFIX)) {
    return "bumon";
  }

  return null;
}

/**
 * 前月の年月をyyyyMM形式で取得する。
 */
function getTargetMonth(): string {
  return format(subMonths(new Date(), 1), "yyyyMM");
}

/**
 * 出力先情報を作成する。
 */
function createOutputPaths(
  baseDir: string,
  targetMonth: string,
): {
  folderPath: string;
  zipPath: string;
} {
  const folderPath = path.join(
    baseDir,
    `${targetMonth}${OUTPUT_FOLDER_SUFFIX}`,
  );

  return {
    folderPath,
    zipPath: `${folderPath}.zip`,
  };
}

/**
 * 出力先が既に存在しないことを確認する。
 */
async function validateOutputPaths(
  folderPath: string,
  zipPath: string,
): Promise<void> {
  if (await fs.pathExists(folderPath)) {
    throw new Error(
      `既にフォルダが存在します。\n${folderPath}\n` +
        "フォルダを削除後、再度実施して下さい。",
    );
  }

  if (await fs.pathExists(zipPath)) {
    throw new Error(
      `既にZIPファイルが存在します。\n${zipPath}\n` +
        "ZIPファイルを削除後、再度実施して下さい。",
    );
  }
}

/**
 * 入力ファイルを1件処理する。
 */
async function processInputFile(
  inputPath: string,
  outputFolderPath: string,
  targetMonth: string,
): Promise<E14Output | null> {
  const stat = await fs.stat(inputPath);

  // ファイル以外は対象外
  if (!stat.isFile()) {
    return null;
  }

  const fileName = path.basename(inputPath);
  const fileType = getFileType(fileName);

  // E14対象外
  if (!fileType) {
    return null;
  }

  if (fileType === "tanpin") {
    const outputPath = path.join(
      outputFolderPath,
      `${targetMonth}${TANPIN_OUTPUT_NAME}.xlsx`,
    );

    await processTanpin(inputPath, outputPath);

    return {
      fileType,
      inputPath,
      outputPath,
    };
  }

  const outputPath = path.join(
    outputFolderPath,
    `${targetMonth}${BUMON_OUTPUT_NAME}.xlsx`,
  );

  await processBumon(inputPath, outputPath);

  return {
    fileType,
    inputPath,
    outputPath,
  };
}

/**
 * 入力ファイルをすべて処理する。
 */
async function processInputFiles(
  inputPaths: string[],
  outputFolderPath: string,
  targetMonth: string,
): Promise<E14Output[]> {
  const outputs: E14Output[] = [];

  for (const inputPath of inputPaths) {
    const output = await processInputFile(
      inputPath,
      outputFolderPath,
      targetMonth,
    );

    if (output) {
      outputs.push(output);
    }
  }

  return outputs;
}

/**
 * 処理対象ファイルが存在することを確認する。
 */
function validateProcessedFiles(outputs: E14Output[]): void {
  if (outputs.length === 0) {
    throw new Error(
      "対象のファイル（ＴＶ売上 / 05 部門別売上）が含まれていません。",
    );
  }
}

/**
 * ZIPに含めるファイルを取得する。
 *
 * E14では加工後のExcelファイルだけをZIPに含める。
 */
function getZipSourceFiles(outputs: E14Output[]): string[] {
  return outputs.map((output) => output.outputPath);
}

/**
 * TV売上集計・メール用ファイル作成ジョブ。
 *
 * 入力：
 * - ＴＶ売上ファイル
 * - 05 部門別売上ファイル
 *
 * 出力：
 * - yyyyMM_ベルクTV売上.zip
 *
 * ZIP内容：
 * - yyyyMMベルクTV単品売上.xlsx
 * - yyyyMMベルクTV部門別売上.xlsx
 */
export async function runJobE14(
  inputFilePath?: string | string[],
): Promise<JobResult> {
  // ============================================================
  // 1. 入力ファイル
  // ============================================================

  const inputPaths = normalizeInputPaths(inputFilePath);

  if (inputPaths.length === 0) {
    throw new Error(
      "入力ファイルが指定されていません。対象のファイルをドロップしてください。",
    );
  }

  // ============================================================
  // 2. 出力先
  // ============================================================

  const targetMonth = getTargetMonth();

  // 最初の入力ファイルがある場所を出力先にする
  const baseDir = path.dirname(inputPaths[0]);

  const { folderPath: outputFolderPath, zipPath: outputZipPath } =
    createOutputPaths(baseDir, targetMonth);

  // ============================================================
  // 3. 既存チェック
  // ============================================================

  await validateOutputPaths(outputFolderPath, outputZipPath);

  // ============================================================
  // 4. 作業フォルダ作成
  // ============================================================

  await fs.ensureDir(outputFolderPath);

  try {
    // ==========================================================
    // 5. Excel加工
    // ==========================================================

    const outputs = await processInputFiles(
      inputPaths,
      outputFolderPath,
      targetMonth,
    );

    // ==========================================================
    // 6. 対象ファイル確認
    // ==========================================================

    validateProcessedFiles(outputs);

    // ==========================================================
    // 7. ZIP作成
    // ==========================================================

    const zipSourceFiles = getZipSourceFiles(outputs);

    await compressFiles(zipSourceFiles, outputZipPath);

    // ==========================================================
    // 8. ZIP作成成功後に作業フォルダ削除
    // ==========================================================

    await fs.remove(outputFolderPath);

    return {
      message: "正常終了",
      artifacts: [
        {
          name: path.basename(outputZipPath),
          path: outputZipPath,
        },
      ],
    };
  } catch (error) {
    // エラー時は作業フォルダを残す。
    // 加工途中のExcelを確認できるようにする。
    throw error instanceof Error ? error : new Error(String(error));
  }
}
