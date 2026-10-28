// electron/features/masterData/infrastructure/spreadsheetClient.ts

import { authService } from "@electron/features/auth/authService";
import {
  SHEETS,
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { normalizeSpreadsheetRows } from "./spreadsheetDataNormalizer";

export interface FetchSheetResult<TSheetId extends SheetId> {
  success: boolean;
  unauthorized: boolean;
  data: SheetData<TSheetId>;
  error?: string;
}

export type SheetDataResult<TSheetId extends SheetId> =
  FetchSheetResult<TSheetId>;

// ヘッダーとデータ行からレコードを生成する。
function parseSheetRows<T>(rows: string[][]): T[] {
  if (rows.length <= 1) {
    return [];
  }

  const [headers, ...dataRows] = rows;

  return dataRows
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => {
      const item: Record<string, string> = {};

      headers.forEach((header, index) => {
        if (header) {
          item[header] = row[index] ?? "";
        }
      });

      return item as T;
    });
}

// シートの行データをレコードに変換し、文字列を正規化する。
export function normalizeSheetData<TSheetId extends SheetId>(
  _sheetId: TSheetId,
  rows: string[][],
): SheetData<TSheetId> {
  return normalizeSpreadsheetRows(
    parseSheetRows<SheetData<TSheetId>[number]>(rows),
  ) as SheetData<TSheetId>;
}

function getSheetConfig(sheetId: SheetId) {
  return Object.values(SHEETS).find((sheet) => sheet.sheetName === sheetId);
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
