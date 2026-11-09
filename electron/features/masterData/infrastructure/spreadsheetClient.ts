// electron/features/masterData/infrastructure/spreadsheetClient.ts

import {
  authService,
  GoogleAuthError,
} from "@electron/features/auth/authService";
import {
  SHEETS,
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { normalizeSpreadsheetRows } from "./spreadsheetDataNormalizer";

const SPREADSHEET_CLIENT_CONFIG = {
  apiBaseUrl: "https://sheets.googleapis.com/v4/spreadsheets",
  headerMappings: {
    AutoManualUrl: "autoManualUrl",
  } as const,
} as const;

type DefaultSheetRow<TSheetId extends SheetId> = SheetData<TSheetId>[number];

export interface SheetDataResult<
  TSheetId extends SheetId,
  TRow extends object = DefaultSheetRow<TSheetId>,
> {
  success: boolean;
  unauthorized: boolean;
  data: TRow[];
  error?: string;
}

// シートの列名をアプリケーション側のプロパティ名に合わせる。
function normalizeHeader(header: string): string {
  if (header in SPREADSHEET_CLIENT_CONFIG.headerMappings) {
    return SPREADSHEET_CLIENT_CONFIG.headerMappings[
      header as keyof typeof SPREADSHEET_CLIENT_CONFIG.headerMappings
    ];
  }

  return header.trim();
}

// ヘッダーとデータ行からレコードを生成する。
function parseSheetRows<T>(rows: string[][]): T[] {
  if (rows.length <= 1) {
    return [];
  }

  const [headers, ...dataRows] = rows;
  const normalizedHeaders = headers.map(normalizeHeader);

  return dataRows
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => {
      const item: Record<string, string> = {};

      normalizedHeaders.forEach((header, index) => {
        if (header) {
          item[header] = row[index] ?? "";
        }
      });

      return item as T;
    });
}

// シートの行データをレコードに変換し、文字列を正規化する。
function normalizeSheetData<
  TSheetId extends SheetId,
  TRow extends object = DefaultSheetRow<TSheetId>,
>(_sheetId: TSheetId, rows: string[][]): TRow[] {
  return normalizeSpreadsheetRows(parseSheetRows<TRow>(rows));
}

function getSheetConfig(sheetId: SheetId) {
  return Object.values(SHEETS).find((sheet) => sheet.sheetName === sheetId);
}

export async function fetchSheet<
  TSheetId extends SheetId,
  TRow extends object = DefaultSheetRow<TSheetId>,
>(sheetId: TSheetId): Promise<SheetDataResult<TSheetId, TRow>> {
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
  const url = `${SPREADSHEET_CLIENT_CONFIG.apiBaseUrl}/${encodeURIComponent(sheet.spreadsheetId)}/values/${encodeURIComponent(range)}`;

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
      data: normalizeSheetData<TSheetId, TRow>(sheetId, json.values ?? []),
    };
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      return {
        success: false,
        unauthorized: true,
        data: [],
      };
    }

    return {
      success: false,
      unauthorized: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
