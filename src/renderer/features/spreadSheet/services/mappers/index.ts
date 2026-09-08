import type { SheetDataResponse } from "@shared/types/spreadsheet";

import {
  SPREADSHEET_CONFIGS,
  type SheetId,
} from "@renderer/features/spreadSheet/services/spreadsheetConfig";

import { fetchRawSheetValues } from "../spreadsheetApi";

import { parseShopSheet } from "./shopMapper";
import { parseJugyoinSheet } from "./jugyoinMapper";
import { parseKokyuhyoSheet } from "./kokyuhyoMapper";
import { parseTantouSheet } from "./tantouMapper";

export interface FetchSheetResult {
  status: number;
  data?: SheetDataResponse;
  errorText?: string;
}

type SheetType = "Store" | "Kokyuhyo" | "Jugyoin" | "Tantou";

const SHEET_TYPE_BY_ID: Record<SheetId, SheetType> = {
  StoreMasterData: "Store",
  KokyuhyoMasterData: "Kokyuhyo",
  JugyoinList: "Jugyoin",
  KokyuhyoTantouMasterData: "Tantou",
};

export async function fetchSheetValues(
  sheetId: SheetId,
  accessToken: string,
): Promise<FetchSheetResult> {
  const config = SPREADSHEET_CONFIGS[sheetId];

  const apiRes = await fetchRawSheetValues(
    `${config.sheetName}!A1:ZZ`,
    accessToken,
  );

  if (apiRes.status !== 200 || !apiRes.values) {
    return {
      status: apiRes.status,
      errorText: apiRes.errorText,
    };
  }

  let parsedData: unknown[];

  switch (sheetId) {
    case "StoreMasterData":
      parsedData = parseShopSheet(apiRes.values);
      break;

    case "KokyuhyoMasterData":
      parsedData = parseKokyuhyoSheet(apiRes.values);
      break;

    case "JugyoinList":
      parsedData = parseJugyoinSheet(apiRes.values);
      break;

    case "KokyuhyoTantouMasterData":
      parsedData = [parseTantouSheet(apiRes.values)];
      break;
  }

  return {
    status: 200,
    data: {
      sheetType: SHEET_TYPE_BY_ID[sheetId],
      data: parsedData,
    },
  };
}

export * from "./commonMapper";
