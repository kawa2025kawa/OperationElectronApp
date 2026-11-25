// electron/features/masterData/infrastructure/spreadsheetClient.ts

import {
  GoogleAuthError,
  googleApiRequest,
} from "@electron/features/auth/googleApiClient";
import {
  SHEETS,
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { normalizeSpreadsheetRows } from "./spreadsheetDataNormalizer";

const GOOGLE_SHEETS_API_BASE_URL =
  "https://sheets.googleapis.com/v4/spreadsheets" as const;

const HEADER_MAPPINGS = {
  AutoManualUrl: "autoManualUrl",
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

export function quoteSheetName(sheetName: string): string {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

export function buildSheetValuesUrl(
  spreadsheetId: string,
  sheetName: string,
  suffix = "",
  query = "",
): string {
  const encodedId = encodeURIComponent(spreadsheetId);
  const encodedRange = encodeURIComponent(quoteSheetName(sheetName));
  const queryString = query ? `?${query}` : "";
  return `${GOOGLE_SHEETS_API_BASE_URL}/${encodedId}/values/${encodedRange}${suffix}${queryString}`;
}

function normalizeHeader(header: string): string {
  if (header in HEADER_MAPPINGS) {
    return HEADER_MAPPINGS[header as keyof typeof HEADER_MAPPINGS];
  }
  return header.trim();
}

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

export async function fetchSheet<
  TSheetId extends SheetId,
  TRow extends object = DefaultSheetRow<TSheetId>,
>(sheetId: TSheetId): Promise<SheetDataResult<TSheetId, TRow>> {
  const sheet = Object.values(SHEETS).find((s) => s.sheetName === sheetId);
  if (!sheet) {
    return {
      success: false,
      unauthorized: false,
      data: [],
      error: `シート設定が見つかりません: ${sheetId}`,
    };
  }

  try {
    const response = await googleApiRequest(
      buildSheetValuesUrl(sheet.spreadsheetId, sheet.sheetName),
    );
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
      data: normalizeSpreadsheetRows(parseSheetRows<TRow>(json.values ?? [])),
    };
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      return { success: false, unauthorized: true, data: [] };
    }

    return {
      success: false,
      unauthorized: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
