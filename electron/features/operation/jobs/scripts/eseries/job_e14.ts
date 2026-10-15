// electron/features/operation/jobs/scripts/eseries/job_e14.ts

import path from "node:path";
import fs from "fs-extra";
import * as ExcelJS from "exceljs";
import { subMonths } from "date-fns";
import type { JobResult } from "@shared/types/operation/operationTypes";

import { compressFiles, getFileInfo } from "../helpers/fileUtils";
import { JobLogger } from "@electron/features/operation/jobs/scripts/helpers/jobLogger";
import { directoryExists } from "@electron/features/operation/jobs/scripts/helpers/folderUtils";
import {
  formatDateTime,
  getDateKey,
} from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const TANPIN_PREFIX = "ＴＶ売上";
const BUMON_PREFIX = "05 部門別売上（イオン向け）";
const TANPIN_OUTPUT_NAME = "ベルクTV単品売上";
const BUMON_OUTPUT_NAME = "ベルクTV部門別売上";
const OUTPUT_FOLDER_SUFFIX = "_ベルクTV売上";

const TANPIN_DELETE_ROW = 26;
const TANPIN_DELETE_TOP_ROWS = 24;
const BUMON_DELETE_TOP_ROWS = 23;

type E14FileType = "tanpin" | "bumon";

interface E14Output {
  outputPath: string;
}

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

async function saveWorkbook(
  workbook: ExcelJS.Workbook,
  outputPath: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(outputPath));
  await workbook.xlsx.writeFile(outputPath);
}

function getFileType(fileName: string): E14FileType | null {
  if (fileName.startsWith(TANPIN_PREFIX)) return "tanpin";
  if (fileName.startsWith(BUMON_PREFIX)) return "bumon";
  return null;
}

async function processBumon(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const { workbook, worksheet } = await loadWorksheet(inputPath);
  worksheet.spliceRows(1, BUMON_DELETE_TOP_ROWS);
  await saveWorkbook(workbook, outputPath);
}

async function processTanpin(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const { workbook, worksheet } = await loadWorksheet(inputPath);

  worksheet.spliceRows(TANPIN_DELETE_ROW, 1);
  worksheet.spliceRows(1, TANPIN_DELETE_TOP_ROWS);

  const a1 = worksheet.getCell("A1");
  const b1 = worksheet.getCell("B1");

  if (a1.master !== a1) {
    worksheet.unMergeCells(a1.master.address);
  } else if (b1.master !== b1) {
    worksheet.unMergeCells(b1.master.address);
  }

  const { rowCount, columnCount } = worksheet;

  // 列削除前に、JANコード・商品名・その他の列の値を退避する。
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

async function processInputFile(
  inputPath: string,
  outputFolderPath: string,
  targetMonth: string,
  logger: JobLogger,
): Promise<E14Output | null> {
  const fileInfo = await getFileInfo(inputPath);
  const { fileName, mtime } = fileInfo;
  const fileType = getFileType(fileName);

  logger.log(`入力ファイル : ${fileName}`);
  logger.log(`更新日時 : ${formatDateTime(mtime)}`);

  if (!fileType) {
    logger.log(`対象外ファイルのためスキップ : ${fileName}`);
    return null;
  }

  const isTanpin = fileType === "tanpin";
  const outputName = isTanpin ? TANPIN_OUTPUT_NAME : BUMON_OUTPUT_NAME;
  const outputPath = path.join(
    outputFolderPath,
    `${targetMonth}${outputName}.xlsx`,
  );

  logger.log(`ファイル種別 : ${isTanpin ? "単品売上" : "部門別売上"}`);
  logger.log(`出力ファイル : ${outputPath}`);

  if (isTanpin) {
    await processTanpin(inputPath, outputPath);
  } else {
    await processBumon(inputPath, outputPath);
  }

  logger.log(`Excel加工完了 : ${path.basename(outputPath)}`);
  return { outputPath };
}

export async function runJobE14(
  inputFilePath?: string | string[],
): Promise<JobResult> {
  const logger = new JobLogger();
  logger.log("ベルクTV売上ファイル加工処理を開始します");

  try {
    const inputPaths = inputFilePath
      ? Array.isArray(inputFilePath)
        ? inputFilePath
        : [inputFilePath]
      : [];

    if (inputPaths.length === 0) {
      throw new Error(
        "入力ファイルが指定されていません。対象のファイルをドロップしてください。",
      );
    }

    logger.log(`入力ファイル数 : ${inputPaths.length}件`);
    inputPaths.forEach((filePath) => logger.log(`指定ファイル : ${filePath}`));

    const targetMonth = getDateKey(subMonths(new Date(), 1), "yyyyMM");
    const outputFolderPath = path.join(
      path.dirname(inputPaths[0]),
      `${targetMonth}${OUTPUT_FOLDER_SUFFIX}`,
    );
    const outputZipPath = `${outputFolderPath}.zip`;

    logger.log(`対象年月 : ${targetMonth}`);
    logger.log(`出力フォルダ : ${outputFolderPath}`);
    logger.log(`出力ZIP : ${outputZipPath}`);

    if (await directoryExists(outputFolderPath)) {
      throw new Error(
        `既にフォルダが存在します。\n${outputFolderPath}\nフォルダを削除後、再度実施して下さい。`,
      );
    }

    if (await directoryExists(outputZipPath)) {
      throw new Error(
        `既にZIPファイルが存在します。\n${outputZipPath}\nZIPファイルを削除後、再度実施して下さい。`,
      );
    }

    await fs.ensureDir(outputFolderPath);
    logger.log("出力フォルダを作成しました");

    const outputs: E14Output[] = [];

    // 出力先が同じファイルの並列書き込みを避けるため、順次処理する。
    for (const inputPath of inputPaths) {
      const output = await processInputFile(
        inputPath,
        outputFolderPath,
        targetMonth,
        logger,
      );

      if (output) outputs.push(output);
    }

    if (outputs.length === 0) {
      throw new Error(
        "対象のファイル（ＴＶ売上 / 05 部門別売上）が含まれていません。",
      );
    }

    logger.log(`加工完了ファイル数 : ${outputs.length}件`);
    logger.log("加工済みファイルをZIP圧縮しています");

    await compressFiles(
      outputs.map(({ outputPath }) => outputPath),
      outputZipPath,
    );

    logger.log(`ZIP作成完了 : ${outputZipPath}`);

    await fs.remove(outputFolderPath);
    logger.log("一時出力フォルダを削除しました");

    return {
      message: logger.complete("正常終了"),
      artifacts: [
        {
          name: path.basename(outputZipPath),
          path: outputZipPath,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw logger.fail(message);
  }
}
