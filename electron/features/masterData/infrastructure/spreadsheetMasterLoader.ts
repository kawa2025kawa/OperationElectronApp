// electron/features/masterData/infrastructure/spreadsheetMasterLoader.ts

import {
  SHEETS,
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import type { RdpMaster } from "../../rdp/rdpMasterTypes";
import type { SpreadsheetMasterData } from "../types/internalSpreadsheetMasterDataTypes";
import { fetchSheet } from "./spreadsheetClient";

type DefaultSheetRow<TSheetId extends SheetId> = SheetData<TSheetId>[number];

async function loadSheetData<
  TSheetId extends SheetId,
  TRow extends object = DefaultSheetRow<TSheetId>,
>(sheetId: TSheetId): Promise<TRow[]> {
  const result = await fetchSheet<TSheetId, TRow>(sheetId);

  if (result.success) {
    return result.data;
  }

  if (result.unauthorized) {
    throw new Error(`${sheetId} の取得失敗: Google 認証が必要です`);
  }

  throw new Error(`${sheetId} の取得失敗: ${result.error ?? "不明なエラー"}`);
}

export async function loadSpreadsheetMasterData(): Promise<SpreadsheetMasterData> {
  const [
    stores,
    kokyuhyos,
    jugyoin,
    kokyuhyoTantous,
    operations,
    irregulars,
    rdps,
  ] = await Promise.all([
    loadSheetData(SHEETS.STORE.sheetName),
    loadSheetData(SHEETS.KOKYUHYO.sheetName),
    loadSheetData(SHEETS.JUGYOIN.sheetName),
    loadSheetData(SHEETS.KOKYUHYO_TANTOU.sheetName),
    loadSheetData(SHEETS.OPERATION.sheetName),
    loadSheetData(SHEETS.IRREGULAR.sheetName),
    loadSheetData<typeof SHEETS.RDP.sheetName, RdpMaster>(SHEETS.RDP.sheetName),
  ]);

  return {
    stores,
    kokyuhyos,
    jugyoin,
    kokyuhyoTantous,
    operations,
    irregulars,
    todayIrregulars: [],
    rdps,
  };
}
