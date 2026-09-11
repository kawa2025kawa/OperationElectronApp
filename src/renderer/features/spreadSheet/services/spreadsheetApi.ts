//src\renderer\features\spreadSheet\services\spreadsheetApi.//

import type { SheetId } from "@shared/types/spreadsheet";

export interface SpreadsheetConfig {
  spreadsheetId: string;
  range: string;
}

export const SPREADSHEET_CONFIG_MAP: Record<SheetId, SpreadsheetConfig> = {
  KokyuhyoMasterData: {
    spreadsheetId: "19CYXIor7Zz3i0KfNY1t5gDKWRU62o2Sq1Tp5iBgaocc",
    range: "KokyuhyoMasterData",
  },
  KokyuhyoTantouMasterData: {
    spreadsheetId: "19CYXIor7Zz3i0KfNY1t5gDKWRU62o2Sq1Tp5iBgaocc",
    range: "KokyuhyoTantouMasterData",
  },
  JugyoinMasterData: {
    spreadsheetId: "1DdhzdvH-Z33sK6Zfk8_ZHBqVBmB0MxD9su0NVbge8gI",
    range: "JugyoinMasterData",
  },
  StoreMasterData: {
    spreadsheetId: "1VYh6hj7_j17edeAIpAntvFQIcFMojosuUtj_PXDbXc0",
    range: "StoreMasterData",
  },
};

/**
 * 全シートIDの配列 (SPREADSHEET_CONFIG_MAP のキーから自動抽出)
 */
export const ALL_SHEET_IDS = Object.keys(
  SPREADSHEET_CONFIG_MAP,
) as readonly SheetId[];

export interface FetchRawSheetResult {
  status: number;
  values?: string[][];
  errorText?: string;
}

export async function fetchRawSheetValues(
  sheetId: SheetId,
  accessToken: string,
): Promise<FetchRawSheetResult> {
  const config = SPREADSHEET_CONFIG_MAP[sheetId];

  if (!config) {
    return {
      status: 400,
      errorText: `未対応のシートIDです: ${sheetId}`,
    };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(config.range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    return { status: 401 };
  }

  if (!res.ok) {
    return {
      status: res.status,
      errorText: await res.text(),
    };
  }

  const json = (await res.json()) as { values?: string[][] };

  return {
    status: 200,
    values: json.values ?? [],
  };
}
