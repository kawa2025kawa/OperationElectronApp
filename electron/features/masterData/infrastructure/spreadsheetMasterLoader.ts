// electron/features/masterData/infrastructure/spreadsheetMasterLoader.ts

import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";
import { fetchSheet } from "./spreadsheetClient";

async function loadSheetData<TSheetId extends SheetId>(sheetId: TSheetId) {
  const result = await fetchSheet(sheetId);

  if (result.success) return result.data;
  if (result.unauthorized)
    throw new Error(`${sheetId} の取得失敗: Google 認証が必要です`);
  throw new Error(`${sheetId} の取得失敗: ${result.error ?? "不明なエラー"}`);
}

export async function loadSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  const sheetDefinitions = Object.values(SHEETS);

  const results = await Promise.all(
    sheetDefinitions.map((def) => loadSheetData(def.sheetName)),
  );

  return {
    stores: results[0] as SpreadsheetMasterData["stores"],
    kokyuhyos: results[1] as SpreadsheetMasterData["kokyuhyos"],
    jugyoin: results[2] as SpreadsheetMasterData["jugyoin"],
    kokyuhyoTantous: results[3] as SpreadsheetMasterData["kokyuhyoTantous"],
  };
}
