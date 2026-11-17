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

interface SheetLoadResult<TRow> {
  data: TRow[];
  error?: string;
}

async function loadSheetData<
  TSheetId extends SheetId,
  TRow extends object = DefaultSheetRow<TSheetId>,
>(sheetId: TSheetId): Promise<SheetLoadResult<TRow>> {
  const result = await fetchSheet<TSheetId, TRow>(sheetId);

  if (result.success) {
    return { data: result.data };
  }

  const error = result.unauthorized
    ? `${sheetId} の取得失敗: Google 認証が必要です`
    : `${sheetId} の取得失敗: ${result.error ?? "不明なエラー"}`;

  console.error(`[SpreadsheetMasterLoader] ${error}`);

  return {
    data: [],
    error,
  };
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

  const errors: SpreadsheetMasterData["errors"] = {};

  if (stores.error) errors[SHEETS.STORE.sheetName] = stores.error;
  if (kokyuhyos.error) errors[SHEETS.KOKYUHYO.sheetName] = kokyuhyos.error;
  if (jugyoin.error) errors[SHEETS.JUGYOIN.sheetName] = jugyoin.error;
  if (kokyuhyoTantous.error) {
    errors[SHEETS.KOKYUHYO_TANTOU.sheetName] = kokyuhyoTantous.error;
  }
  if (operations.error) errors[SHEETS.OPERATION.sheetName] = operations.error;
  if (irregulars.error) errors[SHEETS.IRREGULAR.sheetName] = irregulars.error;
  if (rdps.error) errors[SHEETS.RDP.sheetName] = rdps.error;

  return {
    stores: stores.data,
    kokyuhyos: kokyuhyos.data,
    jugyoin: jugyoin.data,
    kokyuhyoTantous: kokyuhyoTantous.data,
    operations: operations.data,
    irregulars: irregulars.data,
    todayIrregulars: [],
    rdps: rdps.data,
    errors,
  };
}
