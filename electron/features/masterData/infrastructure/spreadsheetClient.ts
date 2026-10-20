// electron/features/masterData/infrastructure/spreadsheetClient.ts

import { authService } from "@electron/features/auth/authService";
import {
  normalizeSheetData,
  type FetchSheetResult,
} from "@shared/services/spreadsheetService";
import {
  SHEETS,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";

function getSheetConfig(sheetId: SheetId) {
  return Object.values(SHEETS).find((sheet) => sheet.sheetName === sheetId);
}

export type SheetDataResult<TSheetId extends SheetId> =
  FetchSheetResult<TSheetId>;

export async function fetchSheet<TSheetId extends SheetId>(
  sheetId: TSheetId,
): Promise<SheetDataResult<TSheetId>> {
  const sheet = getSheetConfig(sheetId);
  if (!sheet) {
    return {
      success: false,
      unauthorized: false,
      data: [],
      error: `シート設定が見つかりません: ${sheetId}`,
    };
  }

  const range = `'${sheet.sheetName.replace(/'/g, "''")}'`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheet.spreadsheetId)}/values/${encodeURIComponent(range)}`;

  try {
    const response = await authService.request(url);
    const responseText = await response.text();

    if (response.status === 401) {
      return { success: false, unauthorized: true, data: [] };
    }

    if (!response.ok) {
      return {
        success: false,
        unauthorized: false,
        data: [],
        error:
          response.status === 503
            ? "Google API サービス利用不可 (503)"
            : responseText || `APIエラー (Status: ${response.status})`,
      };
    }

    let json: { values?: string[][] };
    try {
      json = JSON.parse(responseText);
    } catch {
      return {
        success: false,
        unauthorized: false,
        data: [],
        error: "Google Sheets API response is not valid JSON",
      };
    }

    return {
      success: true,
      unauthorized: false,
      data: normalizeSheetData(sheetId, json.values ?? []),
    };
  } catch (error) {
    return {
      success: false,
      unauthorized: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
