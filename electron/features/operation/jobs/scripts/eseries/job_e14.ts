// electron/features/operation/jobs/scripts/eseries/job_e14.ts

import path from "node:path";
import fs from "fs-extra";
import * as ExcelJS from "exceljs";
import { subMonths } from "date-fns";
import type { JobResult } from "@shared/types/operation/operationTypes";

import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { createZipArchive } from "@electron/features/operation/jobs/scripts/helpers/zipHelper";
import {
  directoryExists,
  fileExists,
  getDateKey,
} from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const CONFIG = {
  tanpinPrefix: "ＴＶ売上",
  bumonPrefix: "05 部門別売上（イオン向け）",
  tanpinOutputName: "ベルクTV単品売上",
  bumonOutputName: "ベルクTV部門別売上",
  outputFolderSuffix: "_ベルクTV売上",
  tanpinDeleteRow: 26,
  tanpinDeleteTopRows: 24,
  bumonDeleteTopRows: 23,
} as const;

type E14FileType = "tanpin" | "bumon";

type ProcessedFile = {
  sourceFileName: string;
  outputPath: string;
  fileType: E14FileType;
};

type JobResultData = {
  targetMonth: string;
  processedFiles: ProcessedFile[];
  outputZipPath: string;
};

/**
 * ベルクTV売上（単品売上・部門別売上）Excelファイルを加工し、ZIPアーカイブを作成する。
 *
 * 入力ファイル:
 * - ＴＶ売上... / 05 部門別売上... Excelファイル
 *
 * 業務上の要対応:
 * - なし（正常完了後、成果物ZIPを返却）
 *
 * システムエラー:
 * - 入力ファイル未指定・対象外ファイル
 * - 出力先フォルダ・ZIPの重複
 * - Excelシート読み込み・加工失敗
 * - ZIPアーカイブ作成失敗
 */
export async function runJobE14(
  inputFilePath?: string | string[],
): Promise<JobResult> {
  const logger = new JobLogger();
  const inputPaths = resolveInputPaths(inputFilePath);

  if (inputPaths.length === 0) {
    throw logger.fail(
      "入力ファイルが指定されていません。対象のファイルをドロップしてください。",
    );
  }

  const baseDir = path.dirname(inputPaths[0]);
  const targetMonth = getDateKey(subMonths(new Date(), 1), "yyyyMM");
  const zipPrefix = `${targetMonth}${CONFIG.outputFolderSuffix}`;
  const outputFolderPath = path.join(baseDir, zipPrefix);
  const outputZipPath = `${outputFolderPath}.zip`;

  try {
    if (await directoryExists(outputFolderPath)) {
      throw new Error(
        `既にフォルダが存在します。\n${outputFolderPath}\nフォルダを削除後、再度実施して下さい。`,
      );
    }

    if (await fileExists(outputZipPath)) {
      throw new Error(
        `既にZIPファイルが存在します。\n${outputZipPath}\nZIPファイルを削除後、再度実施して下さい。`,
      );
    }

    await fs.ensureDir(outputFolderPath);

    const processedFiles = await processAllFiles(
      inputPaths,
      outputFolderPath,
      targetMonth,
    );

    if (processedFiles.length === 0) {
      throw new Error(
        "対象のファイル（ＴＶ売上 / 05 部門別売上）が含まれていません。",
      );
    }

    await createZipArchive(
      {
        filePaths: processedFiles.map((file) => file.outputPath),
        outputDir: baseDir,
        zipPrefix,
        includeFileList: true,
      },
      logger,
    );

    const result: JobResultData = {
      targetMonth,
      processedFiles,
      outputZipPath,
    };

    return writeResultLog(logger, result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("\n\n▶ ")) {
      throw error;
    }

    const detail = error instanceof Error ? ` (${error.message})` : "";

    throw logger.fail(`ファイル処理に失敗しました${detail}`);
  } finally {
    if (await directoryExists(outputFolderPath)) {
      await fs.remove(outputFolderPath);
    }
  }
}

/**
 * 入力ファイルパス配列を平坦化・検証する。
 */
function resolveInputPaths(inputFilePath?: string | string[]): string[] {
  if (!inputFilePath) return [];
  return Array.isArray(inputFilePath) ? inputFilePath : [inputFilePath];
}

/**
 * ファイル名からファイル種別を判定する。
 */
function getFileType(fileName: string): E14FileType | null {
  if (fileName.startsWith(CONFIG.tanpinPrefix)) return "tanpin";
  if (fileName.startsWith(CONFIG.bumonPrefix)) return "bumon";
  return null;
}

/**
 * 指定されたExcelファイルを全件順次加工する。
 */
async function processAllFiles(
  inputPaths: string[],
  outputFolderPath: string,
  targetMonth: string,
): Promise<ProcessedFile[]> {
  const processedFiles: ProcessedFile[] = [];

  for (const inputPath of inputPaths) {
    const fileName = path.basename(inputPath);
    const fileType = getFileType(fileName);

    if (!fileType) {
      continue;
    }

    const isTanpin = fileType === "tanpin";
    const outputName = isTanpin
      ? CONFIG.tanpinOutputName
      : CONFIG.bumonOutputName;
    const outputPath = path.join(
      outputFolderPath,
      `${targetMonth}${outputName}.xlsx`,
    );

    if (isTanpin) {
      await processTanpin(inputPath, outputPath);
    } else {
      await processBumon(inputPath, outputPath);
    }

    processedFiles.push({
      sourceFileName: fileName,
      outputPath,
      fileType,
    });
  }

  return processedFiles;
}

/**
 * Excelワークシートをロードする。
 */
async function loadWorksheet(filePath: string): Promise<{
  workbook: ExcelJS.Workbook;
  worksheet: ExcelJS.Worksheet;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error(`Excelシートが存在しません。\n${filePath}`);
  }

  return { workbook, worksheet };
}

/**
 * 加工後ワークブックを保存する。
 */
async function saveWorkbook(
  workbook: ExcelJS.Workbook,
  outputPath: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(outputPath));
  await workbook.xlsx.writeFile(outputPath);
}

/**
 * 部門別売上Excelの加工処理。
 */
async function processBumon(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const { workbook, worksheet } = await loadWorksheet(inputPath);

  worksheet.spliceRows(1, CONFIG.bumonDeleteTopRows);

  await saveWorkbook(workbook, outputPath);
}

/**
 * 単品売上Excelの加工処理。
 */
async function processTanpin(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const { workbook, worksheet } = await loadWorksheet(inputPath);

  worksheet.spliceRows(CONFIG.tanpinDeleteRow, 1);
  worksheet.spliceRows(1, CONFIG.tanpinDeleteTopRows);

  const a1 = worksheet.getCell("A1");
  const b1 = worksheet.getCell("B1");

  if (a1.master !== a1) {
    worksheet.unMergeCells(a1.master.address);
  } else if (b1.master !== b1) {
    worksheet.unMergeCells(b1.master.address);
  }

  const { rowCount, columnCount } = worksheet;

  const rows = Array.from({ length: rowCount }, (_, i) => i + 1);
  const productNames = rows.map((row) => worksheet.getCell(row, 2).value);
  const janCodes = rows.map((row) => worksheet.getCell(row, 3).value);

  const otherColumns = Array.from(
    { length: Math.max(0, columnCount - 3) },
    (_, i) => rows.map((row) => worksheet.getCell(row, i + 4).value),
  );

  worksheet.spliceColumns(1, 1);

  rows.forEach((row, i) => {
    worksheet.getCell(row, 1).value = janCodes[i];
    worksheet.getCell(row, 2).value = productNames[i];

    otherColumns.forEach((values, columnIndex) => {
      worksheet.getCell(row, columnIndex + 3).value = values[i];
    });
  });

  worksheet.getCell("A1").value = "JANコード";
  worksheet.getCell("B1").value = "商品名";

  await saveWorkbook(workbook, outputPath);
}

/**
 * 加工結果をログ出力し、JobResult を返却する。
 */
function writeResultLog(logger: JobLogger, result: JobResultData): JobResult {
  logger.section("対象年月");
  logger.log(result.targetMonth);

  logger.section("加工完了ファイル");
  for (const file of result.processedFiles) {
    const label = file.fileType === "tanpin" ? "単品売上" : "部門別売上";
    logger.log(
      `[${label}] ${file.sourceFileName} -> ${path.basename(file.outputPath)}`,
    );
  }

  logger.section("出力ZIP");
  logger.log(result.outputZipPath);

  return {
    message: logger.complete("正常終了"),
    artifacts: [
      {
        name: path.basename(result.outputZipPath),
        path: result.outputZipPath,
      },
    ],
  };
}
