// electron/features/spreadsheet/application/masterDataManager.ts

import {
  SHEETS,
  type MasterData,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import { fetchSheet } from "../infrastructure/spreadsheetClient";
import {
  deleteMasterData,
  loadMasterData,
  saveMasterData,
} from "../infrastructure/masterStorage";

let masterData: MasterData | null = null;
let fetchedAt: string | null = null;

function isSameDay(value: string): boolean {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export async function getMasterData(): Promise<MasterData> {
  if (masterData && fetchedAt && isSameDay(fetchedAt)) {
    return masterData;
  }

  const cache = await loadMasterData();

  if (cache && isSameDay(cache.fetchedAt)) {
    masterData = cache.data;
    fetchedAt = cache.fetchedAt;

    return cache.data;
  }

  return refreshMasterData();
}

export async function clearMasterDataCache(): Promise<void> {
  await deleteMasterData();

  masterData = null;
  fetchedAt = null;
}

async function refreshMasterData(): Promise<MasterData> {
  const results = await Promise.all([
    fetchSheet(SHEETS.STORE.sheetName),
    fetchSheet(SHEETS.KOKYUHYO.sheetName),
    fetchSheet(SHEETS.JUGYOIN.sheetName),
    fetchSheet(SHEETS.KOKYUHYO_TANTOU.sheetName),
    fetchSheet(SHEETS.OPERATION.sheetName),
    fetchSheet(SHEETS.IRREGULAR.sheetName),
    fetchSheet(SHEETS.TODAY_IRREGULAR.sheetName),
    fetchSheet(SHEETS.RDP.sheetName),
  ]);

  const failed = results.find((result) => !result.success);

  if (failed) {
    if (failed.unauthorized) {
      throw new Error("認証セッションが無効です。");
    }

    throw new Error(failed.error ?? "マスターデータの取得に失敗しました。");
  }

  const nextData: MasterData = {
    stores: results[0].data,
    kokyuhyos: results[1].data,
    jugyoin: results[2].data,
    kokyuhyoTantous: results[3].data,
    operations: results[4].data,
    irregulars: results[5].data,
    todayIrregulars: results[6].data,
    rdps: results[7].data,
  };

  masterData = nextData;
  fetchedAt = new Date().toISOString();

  await saveMasterData(nextData);

  return nextData;
}
