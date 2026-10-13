// src/shared/services/spreadsheetService.ts

import {
  SHEETS,
  type SheetData,
  type SheetId,
  type SheetRow,
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
  switch (sheetId) {
    case SHEETS.STORE.sheetName:
      return normalizeGenericRows<SheetRow<typeof SHEETS.STORE.sheetName>>(
        parseSheetRows(rows),
      ) as SheetData<TSheetId>;

    case SHEETS.KOKYUHYO.sheetName:
      return normalizeGenericRows<SheetRow<typeof SHEETS.KOKYUHYO.sheetName>>(
        parseSheetRows(rows),
      ) as SheetData<TSheetId>;

    case SHEETS.JUGYOIN.sheetName:
      return normalizeGenericRows<SheetRow<typeof SHEETS.JUGYOIN.sheetName>>(
        parseSheetRows(rows),
      ) as SheetData<TSheetId>;

    case SHEETS.KOKYUHYO_TANTOU.sheetName:
      return normalizeGenericRows<
        SheetRow<typeof SHEETS.KOKYUHYO_TANTOU.sheetName>
      >(parseSheetRows(rows)) as SheetData<TSheetId>;

    default:
      return [];
  }
}

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
        if (!header) {
          return;
        }

        item[header] = row[index] ?? "";
      });

      return item as T;
    });
}

function normalizeGenericRows<T extends object>(rows: T[]): T[] {
  return rows.map((row) => {
    const normalized = { ...row } as Record<string, unknown>;

    for (const [key, value] of Object.entries(normalized)) {
      if (typeof value === "string") {
        normalized[key] = normalizeString(value);
      }
    }

    return normalized as T;
  });
}

function normalizeString(value: string): string {
  return value.trim();
}
