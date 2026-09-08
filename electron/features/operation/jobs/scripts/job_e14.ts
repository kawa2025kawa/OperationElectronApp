// electron/features/operation/jobs/scripts/job_e14.ts

import * as path from "path";
import fs from "fs-extra";
import * as ExcelJS from "exceljs";
import { format, subMonths } from "date-fns";
import type { JobResult } from "@shared/types/operation";
import { compressFiles } from "./helpers/shared/zip-helper";

// ============================================================
// 1. 定数
// ============================================================
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
  fileType: E14FileType;
  inputPath: string;
  outputPath: string;
}

// ============================================================
// 2. Excel ヘルパー
// ============================================================
async function loadWorksheet(
  filePath: string,
): Promise<{ workbook: ExcelJS.Workbook; worksheet: ExcelJS.Worksheet }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error(`Excelシートが存在しません。\n${filePath}`);
  return { workbook, worksheet };
}

async function saveWorkbook(
  workbook: ExcelJS.Workbook,
  outputPath: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(outputPath));
  await workbook.xlsx.writeFile(outputPath);
}

// ============================================================
// 3. 各種 Excel 加工ロジック (processBumon / processTanpin)
// ============================================================
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

  // 行の削除 (26行目を削除後、1〜24行目を削除)
  worksheet.spliceRows(TANPIN_DELETE_ROW, 1);
  worksheet.spliceRows(1, TANPIN_DELETE_TOP_ROWS);

  // A1:B1の結合解除
  const a1 = worksheet.getCell("A1");
  const b1 = worksheet.getCell("B1");
  if (a1.master !== a1) worksheet.unMergeCells(a1.master.address);
  else if (b1.master !== b1) worksheet.unMergeCells(b1.master.address);

  b1.value = "商品名";
  worksheet.getCell("C1").value = "JANコード";

  const { rowCount, columnCount } = worksheet;
  const rows = Array.from({ length: rowCount }, (_, i) => i + 1);

  // B列(商品名)・C列(JANコード)・D列以降を退避 (Array.from と map を活用)
  const productNames = rows.map((r) => worksheet.getCell(r, 2).value);
  const janCodes = rows.map((r) => worksheet.getCell(r, 3).value);
  const otherColumns = Array.from(
    { length: Math.max(0, columnCount - 3) },
    (_, i) => {
      const colIdx = i + 4;
      return rows.map((r) => worksheet.getCell(r, colIdx).value);
    },
  );

  // 元A列を削除
  worksheet.spliceColumns(1, 1);

  // 再配置 (JANコード -> A列, 商品名 -> B列, その他 -> C列以降)
  rows.forEach((r, idx) => {
    worksheet.getCell(r, 1).value = janCodes[idx];
    worksheet.getCell(r, 2).value = productNames[idx];
    otherColumns.forEach((colValues, colIdx) => {
      worksheet.getCell(r, colIdx + 3).value = colValues[idx];
    });
  });

  worksheet.getCell("A1").value = "JANコード";
  worksheet.getCell("B1").value = "商品名";

  await saveWorkbook(workbook, outputPath);
}

// ============================================================
// 4. 入力ファイル検証・実行ヘルパー
// ============================================================
const getFileType = (fileName: string): E14FileType | null =>
  fileName.startsWith(TANPIN_PREFIX)
    ? "tanpin"
    : fileName.startsWith(BUMON_PREFIX)
      ? "bumon"
      : null;

async function processInputFile(
  inputPath: string,
  outputFolderPath: string,
  targetMonth: string,
): Promise<E14Output | null> {
  const stat = await fs.stat(inputPath);
  if (!stat.isFile()) return null;

  const fileType = getFileType(path.basename(inputPath));
  if (!fileType) return null;

  const isTanpin = fileType === "tanpin";
  const outputName = isTanpin ? TANPIN_OUTPUT_NAME : BUMON_OUTPUT_NAME;
  const outputPath = path.join(
    outputFolderPath,
    `${targetMonth}${outputName}.xlsx`,
  );

  if (isTanpin) {
    await processTanpin(inputPath, outputPath);
  } else {
    await processBumon(inputPath, outputPath);
  }

  return { fileType, inputPath, outputPath };
}

// ============================================================
// 5. メインジョブ関数 (runJobE14)
// ============================================================
export async function runJobE14(
  inputFilePath?: string | string[],
): Promise<JobResult> {
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

  const targetMonth = format(subMonths(new Date(), 1), "yyyyMM");
  const baseDir = path.dirname(inputPaths[0]);
  const outputFolderPath = path.join(
    baseDir,
    `${targetMonth}${OUTPUT_FOLDER_SUFFIX}`,
  );
  const outputZipPath = `${outputFolderPath}.zip`;

  if (await fs.pathExists(outputFolderPath)) {
    throw new Error(
      `既にフォルダが存在します。\n${outputFolderPath}\nフォルダを削除後、再度実施して下さい。`,
    );
  }
  if (await fs.pathExists(outputZipPath)) {
    throw new Error(
      `既にZIPファイルが存在します。\n${outputZipPath}\nZIPファイルを削除後、再度実施して下さい。`,
    );
  }

  await fs.ensureDir(outputFolderPath);

  try {
    // 並列処理と filter で有効な処理結果だけを抽出
    const processedResults = await Promise.all(
      inputPaths.map((p) => processInputFile(p, outputFolderPath, targetMonth)),
    );
    const outputs = processedResults.filter(
      (item): item is E14Output => item !== null,
    );

    if (outputs.length === 0) {
      throw new Error(
        "対象のファイル（ＴＶ売上 / 05 部門別売上）が含まれていません。",
      );
    }

    const zipSourceFiles = outputs.map((o) => o.outputPath);
    await compressFiles(zipSourceFiles, outputZipPath);
    await fs.remove(outputFolderPath);

    return {
      message: "正常終了",
      artifacts: [{ name: path.basename(outputZipPath), path: outputZipPath }],
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}
