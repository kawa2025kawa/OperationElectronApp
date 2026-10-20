// src/shared/services/spreadsheetService.ts

import {
  type SheetData,
  type SheetId,
} from "@shared/types/spreadsheet/spreadsheetTypes";

export interface FetchSheetResult<TSheetId extends SheetId> {
  success: boolean;
  unauthorized: boolean;
  data: SheetData<TSheetId>;
  error?: string;
}

export function normalizeSheetData<TSheetId extends SheetId>(
  sheetId: TSheetId,
  rows: string[][],
): SheetData<TSheetId> {
  return normalizeGenericRows(parseSheetRows(rows)) as SheetData<TSheetId>;
}

function parseSheetRows<T>(rows: string[][]): T[] {
  if (rows.length <= 1) return [];
  const [headers, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => {
      const item: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header) item[header] = row[index] ?? "";
      });
      return item as T;
    });
}

function normalizeGenericRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => {
    const normalized = { ...row } as Record<string, unknown>;
    for (const [key, value] of Object.entries(normalized)) {
      if (typeof value === "string") normalized[key] = value.trim();
    }
    return normalized as T;
  });
}
