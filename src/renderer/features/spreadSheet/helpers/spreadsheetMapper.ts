import {
  SHEET_IDS,
  SHEET_TYPES,
  type SheetDataResponse,
  type SheetId,
  type SheetType,
} from "@shared/types/spreadsheet";
import {
  parseJugyoinSheet,
  parseKokyuhyoSheet,
  parseShopSheet,
  parseTantouSheet,
} from "@renderer/features/spreadSheet/mappers";
import { SPREADSHEET_CONFIGS } from "@renderer/features/spreadSheet/services/sheetConfigs";
import { fetchRawSheetValues } from "@renderer/features/spreadSheet/services/spreadsheetApi";

export interface FetchSheetResult {
  status: number;
  data?: SheetDataResponse;
  errorText?: string;
}

const SHEET_TYPE_BY_ID: Record<SheetId, SheetType> = {
  [SHEET_IDS.SHOP]: SHEET_TYPES.Store,
  [SHEET_IDS.KOKYUHYO]: SHEET_TYPES.Kokyuhyo,
  [SHEET_IDS.JUGYOIN]: SHEET_TYPES.Jugyoin,
  [SHEET_IDS.TANTOU]: SHEET_TYPES.Tantou,
};

export async function fetchSheetValues(
  sheetId: SheetId,
  accessToken: string,
): Promise<FetchSheetResult> {
  const config = SPREADSHEET_CONFIGS[sheetId];
  const apiRes = await fetchRawSheetValues(config.dynamicRange, accessToken);

  if (apiRes.status !== 200 || !apiRes.values) {
    return { status: apiRes.status, errorText: apiRes.errorText };
  }

  let parsedData: unknown[] = [];
  switch (sheetId) {
    case SHEET_IDS.SHOP:
      parsedData = parseShopSheet(apiRes.values, config.keyMap);
      break;
    case SHEET_IDS.KOKYUHYO:
      parsedData = parseKokyuhyoSheet(apiRes.values, config.keyMap);
      break;
    case SHEET_IDS.JUGYOIN:
      parsedData = parseJugyoinSheet(apiRes.values, config.keyMap);
      break;
    case SHEET_IDS.TANTOU:
      parsedData = [parseTantouSheet(apiRes.values)];
      break;
  }

  return {
    status: 200,
    data: {
      sheetType: SHEET_TYPE_BY_ID[sheetId] ?? "Raw",
      data: parsedData,
    },
  };
}
