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

function collectSheetErrors(
  entries: ReadonlyArray<readonly [SheetId, SheetLoadResult<unknown>]>,
): SpreadsheetMasterData["errors"] {
  const errors: SpreadsheetMasterData["errors"] = {};
  for (const [sheetId, result] of entries) {
    if (result.error) {
      errors[sheetId] = result.error;
    }
  }
  return errors;
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

  const errors = collectSheetErrors([
    [SHEETS.STORE.sheetName, stores],
    [SHEETS.KOKYUHYO.sheetName, kokyuhyos],
    [SHEETS.JUGYOIN.sheetName, jugyoin],
    [SHEETS.KOKYUHYO_TANTOU.sheetName, kokyuhyoTantous],
    [SHEETS.OPERATION.sheetName, operations],
    [SHEETS.IRREGULAR.sheetName, irregulars],
    [SHEETS.RDP.sheetName, rdps],
  ]);

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