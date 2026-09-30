// src/shared/services/spreadsheetService.ts

import {
  SHEETS,
  type IrregularMaster,
  type OperationMaster,
  type RdpMaster,
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

    case SHEETS.OPERATION.sheetName:
      return parseSheetRows<OperationMaster>(rows).map(
        normalizeOperationMaster,
      ) as SheetData<TSheetId>;

    case SHEETS.IRREGULAR.sheetName:
      return parseSheetRows<IrregularMaster>(rows).map(
        normalizeIrregularMaster,
      ) as SheetData<TSheetId>;

    case SHEETS.TODAY_IRREGULAR.sheetName:
      return parseSheetRows<IrregularMaster>(rows).map(
        normalizeIrregularMaster,
      ) as SheetData<TSheetId>;

    case SHEETS.RDP.sheetName:
      return parseSheetRows<RdpMaster>(rows).map(
        normalizeRdpMaster,
      ) as SheetData<TSheetId>;

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

function normalizeOperationMaster(row: OperationMaster): OperationMaster {
  return {
    kanriNo: normalizeRequired(row.kanriNo),
    scheduledTime: normalizeRequired(row.scheduledTime),
    workName: normalizeRequired(row.workName),
    jobId: normalizeOptional(row.jobId),
    dependsOn: normalizeOptional(row.dependsOn),
    manualUrl: normalizeOptional(row.manualUrl),
    AutoManualUrl: normalizeOptional(row.AutoManualUrl),
    link: normalizeOptional(row.link),
    other1: normalizeOptional(row.other1),
    other2: normalizeOptional(row.other2),
  };
}

function normalizeIrregularMaster(row: IrregularMaster): IrregularMaster {
  return {
    kanriNo: normalizeRequired(row.kanriNo),
    scheduledTime: normalizeRequired(row.scheduledTime),
    dateRule: normalizeOptional(row.dateRule),
    weekdayRule: normalizeOptional(row.weekdayRule),
    weekRule: normalizeOptional(row.weekRule),
    monthRule: normalizeOptional(row.monthRule),
    workName: normalizeRequired(row.workName),
    dependsOn: normalizeOptional(row.dependsOn),
    manualUrl: normalizeOptional(row.manualUrl),
    AutoManualUrl: normalizeOptional(row.AutoManualUrl),
    link: normalizeOptional(row.link),
    other1: normalizeOptional(row.other1),
    other2: normalizeOptional(row.other2),
  };
}

function normalizeRdpMaster(row: RdpMaster): RdpMaster {
  return {
    name: normalizeString(row.name),
    ipAddress: normalizeString(row.ipAddress),
    userName: normalizeString(row.userName),
    password: normalizeString(row.password),
  };
}

function normalizeRequired(value: string): string {
  return value.trim();
}

function normalizeOptional(value: string): string {
  const normalized = value.trim();

  return normalized === "-" || normalized === "ー" ? "" : normalized;
}

function normalizeString(value: string): string {
  return value.trim();
}
