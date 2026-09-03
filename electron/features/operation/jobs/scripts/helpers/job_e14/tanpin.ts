import * as ExcelJS from "exceljs";

import { TANPIN_DELETE_ROW, TANPIN_DELETE_TOP_ROWS } from "./constants";

import { getFirstWorksheet, loadWorkbook, saveWorkbook } from "./excel";

/**
 * ＴＶ売上（単品売上）を加工する。
 *
 * 元:
 * A = 不要
 * B = 商品名
 * C = JANコード
 * D以降 = その他
 *
 * 最終:
 * A = JANコード
 * B = 商品名
 * C以降 = 元D以降
 */
export async function processTanpin(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const workbook = await loadWorkbook(inputPath);
  const worksheet = getFirstWorksheet(workbook, inputPath);

  // 26行目を先に削除
  worksheet.spliceRows(TANPIN_DELETE_ROW, 1);

  // 1～24行目を削除
  worksheet.spliceRows(1, TANPIN_DELETE_TOP_ROWS);

  // A1:B1の結合を解除
  const a1 = worksheet.getCell("A1");
  const b1 = worksheet.getCell("B1");

  if (a1.master !== a1) {
    worksheet.unMergeCells(a1.master.address);
  } else if (b1.master !== b1) {
    worksheet.unMergeCells(b1.master.address);
  }

  // ヘッダーを設定
  b1.value = "商品名";
  worksheet.getCell("C1").value = "JANコード";

  const rowCount = worksheet.rowCount;
  const columnCount = worksheet.columnCount;

  // B列・C列・D列以降を退避
  const productNames: ExcelJS.CellValue[] = [];
  const janCodes: ExcelJS.CellValue[] = [];
  const otherColumns: ExcelJS.CellValue[][] = [];

  for (let row = 1; row <= rowCount; row++) {
    productNames[row] = worksheet.getCell(row, 2).value;

    janCodes[row] = worksheet.getCell(row, 3).value;
  }

  for (let sourceColumn = 4; sourceColumn <= columnCount; sourceColumn++) {
    const values: ExcelJS.CellValue[] = [];

    for (let row = 1; row <= rowCount; row++) {
      values[row] = worksheet.getCell(row, sourceColumn).value;
    }

    otherColumns.push(values);
  }

  // 元A列だけ削除
  worksheet.spliceColumns(1, 1);

  // 最終列へ配置
  for (let row = 1; row <= rowCount; row++) {
    // 元C列 → A列
    worksheet.getCell(row, 1).value = janCodes[row];

    // 元B列 → B列
    worksheet.getCell(row, 2).value = productNames[row];

    // 元D列以降 → C列以降
    for (let index = 0; index < otherColumns.length; index++) {
      worksheet.getCell(row, index + 3).value = otherColumns[index][row];
    }
  }

  // 最終ヘッダー
  worksheet.getCell("A1").value = "JANコード";

  worksheet.getCell("B1").value = "商品名";

  await saveWorkbook(workbook, outputPath);
}
