// electron/features/masterData/infrastructure/spreadsheetMasterLoader.ts

import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import {
  fetchSheet,
  type SheetDataResult,
} from "@electron/features/spreadsheet/infrastructure/spreadsheetClient";

function unwrapSheetResult<TSheetId extends SheetId>(
  sheetName: string,
  result: SheetDataResult<TSheetId>,
) {
  if (result.success) {
    return result.data;
  }

  if (result.unauthorized) {
    throw new Error(`${sheetName} の取得失敗: Google 認証が必要です`);
  }

  throw new Error(`${sheetName} の取得失敗: ${result.error ?? "不明なエラー"}`);
}

async function fetchSheetWithLogging<TSheetId extends SheetId>(
  sheetName: TSheetId,
  logName: string,
): Promise<SheetDataResult<TSheetId>> {
  try {
    return await fetchSheet(sheetName);
  } catch (err) {
    console.error(
      `[SpreadsheetMasterLoader] ${logName} 取得中に例外が発生:`,
      err,
    );
    throw err;
  }
}

export async function loadSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  const [storeResult, kokyuhyoResult, jugyoinResult, kokyuhyoTantouResult] =
    await Promise.all([
      fetchSheetWithLogging(SHEETS.STORE.sheetName, "StoreMasterData"),
      fetchSheetWithLogging(SHEETS.KOKYUHYO.sheetName, "KokyuhyoMasterData"),
      fetchSheetWithLogging(SHEETS.JUGYOIN.sheetName, "JugyoinMasterData"),
      fetchSheetWithLogging(
        SHEETS.KOKYUHYO_TANTOU.sheetName,
        "KokyuhyoTantouMasterData",
      ),
    ]);

  return {
    stores: unwrapSheetResult(SHEETS.STORE.sheetName, storeResult),
    kokyuhyos: unwrapSheetResult(SHEETS.KOKYUHYO.sheetName, kokyuhyoResult),
    jugyoin: unwrapSheetResult(SHEETS.JUGYOIN.sheetName, jugyoinResult),
    kokyuhyoTantous: unwrapSheetResult(
      SHEETS.KOKYUHYO_TANTOU.sheetName,
      kokyuhyoTantouResult,
    ),
  };
}
