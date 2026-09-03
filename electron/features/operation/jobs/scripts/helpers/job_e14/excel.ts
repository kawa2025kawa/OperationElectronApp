import * as ExcelJS from "exceljs";
import fs from "fs-extra";
import * as path from "path";

export async function loadWorkbook(
  filePath: string,
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(filePath);

  return workbook;
}

export function getFirstWorksheet(
  workbook: ExcelJS.Workbook,
  filePath: string,
): ExcelJS.Worksheet {
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error(`Excelシートが存在しません。\n${filePath}`);
  }

  return worksheet;
}

export async function saveWorkbook(
  workbook: ExcelJS.Workbook,
  outputPath: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(outputPath));

  await workbook.xlsx.writeFile(outputPath);
}
