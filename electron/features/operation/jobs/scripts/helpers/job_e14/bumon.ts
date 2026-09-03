import { BUMON_DELETE_TOP_ROWS } from "./constants";

import { getFirstWorksheet, loadWorkbook, saveWorkbook } from "./excel";

/**
 * 部門別売上を加工する。
 */
export async function processBumon(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const workbook = await loadWorkbook(inputPath);
  const worksheet = getFirstWorksheet(workbook, inputPath);

  worksheet.spliceRows(1, BUMON_DELETE_TOP_ROWS);

  await saveWorkbook(workbook, outputPath);
}
