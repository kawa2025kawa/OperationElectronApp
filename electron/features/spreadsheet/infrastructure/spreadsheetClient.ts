import { authService } from "@electron/features/auth/authIpc";
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

function getSheetRange(sheetName: string): string {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

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

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${encodeURIComponent(sheet.spreadsheetId)}/values/` +
    `${encodeURIComponent(getSheetRange(sheet.sheetName))}`;

  try {
    const response = await authService.request(url);
    const responseText = await response.text();

    if (response.status === 401) {
      return {
        success: false,
        unauthorized: true,
        data: [],
      };
    }

    if (!response.ok) {
      console.error("[SpreadsheetClient] Google Sheets API error", {
        status: response.status,
        spreadsheetId: sheet.spreadsheetId,
        range: sheet.sheetName,
        errorText: responseText,
      });

      return {
        success: false,
        unauthorized: false,
        data: [],
        error:
          response.status === 503
            ? "Google API エラー (503)"
            : responseText || `取得エラー (Status: ${response.status})`,
      };
    }

    let json: { values?: string[][] };

    try {
      json = JSON.parse(responseText) as { values?: string[][] };
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
    const message = error instanceof Error ? error.message : String(error);

    console.error("[SpreadsheetClient] Request failed", {
      sheetId,
      message,
    });

    return {
      success: false,
      unauthorized: false,
      data: [],
      error: message,
    };
  }
}

export type SheetDataResult<TSheetId extends SheetId> =
  FetchSheetResult<TSheetId>;
