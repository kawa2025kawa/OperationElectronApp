// src/renderer/features/spreadSheet/helpers/spreadsheetMapper.ts

import { getSheetRangeConfig } from "../config/spreadsheetConfig";

import {
  MASTER_SPREADSHEET_ID,
  SHEET_IDS,
  type SheetDataResponse,
  type SheetId,
  type SheetType,
  type Tantou,
  type TantouDailyDetails,
} from "@shared/types/spreadsheetTypes";

// =====================================================
// Constants
// =====================================================

const EMPTY_VALUE = "-";
const FALLBACK_ID_PREFIX = "row";

// =====================================================
// Header Helpers
// =====================================================

export function sanitizeHeader(text: string): string {
  return text ? text.replace(/[\r\n\t\s]+/g, "").trim() : "";
}

// =====================================================
// Object Helpers
// =====================================================

function setNestedValue(
  target: Record<string, unknown>,
  path: string,
  value: string,
): void {
  const keys = path.split(".");

  if (keys.length === 0) {
    return;
  }

  let current = target;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];

    if (!key) {
      continue;
    }

    const existing = current[key];

    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  }

  const finalKey = keys[keys.length - 1];

  if (!finalKey) {
    return;
  }

  const normalizedValue = value.trim();

  current[finalKey] = normalizedValue || EMPTY_VALUE;
}

// =====================================================
// Fallback Values
// =====================================================

function setFallbackId(
  item: Record<string, unknown>,
  sheetId: SheetId,
  rowIndex: number,
): void {
  const currentId = item.id;

  if (
    typeof currentId === "string" &&
    currentId.trim() &&
    currentId !== EMPTY_VALUE
  ) {
    return;
  }

  const fallbackId = `${sheetId}_${FALLBACK_ID_PREFIX}_${rowIndex + 1}`;
  const code = item.code;

  item.id =
    typeof code === "string" && code.trim() && code !== EMPTY_VALUE
      ? `${code}_${fallbackId}`
      : fallbackId;
}

function setBusinessHours(item: Record<string, unknown>): void {
  const start =
    typeof item.businessHoursStart === "string"
      ? item.businessHoursStart
      : undefined;

  const end =
    typeof item.businessHoursEnd === "string"
      ? item.businessHoursEnd
      : undefined;

  const hasStart = Boolean(start && start !== EMPTY_VALUE);
  const hasEnd = Boolean(end && end !== EMPTY_VALUE);

  if (!hasStart && !hasEnd) {
    return;
  }

  item.businessHours = [
    hasStart ? start : "00:00",
    hasEnd ? end : "24:00",
  ].join(" ～ ");
}

function setFallbackValues(
  item: Record<string, unknown>,
  sheetId: SheetId,
  rowIndex: number,
): void {
  setFallbackId(item, sheetId, rowIndex);
  setBusinessHours(item);
}

// =====================================================
// Raw Row Parser
// =====================================================

export function parseRawSheetRows<T = Record<string, unknown>>(
  rawRows: string[][],
  sheetId: SheetId,
  keyMap?: Record<string, string>,
): T[] {
  if (rawRows.length <= 1) {
    return [];
  }

  const headers = rawRows[0] ?? [];

  const validKeys = headers.map((header) => {
    const sanitized = sanitizeHeader(header);

    if (!sanitized) {
      return "";
    }

    return keyMap?.[sanitized] ?? sanitized;
  });

  const responseData: Record<string, unknown>[] = [];

  for (const [rowIndex, row] of rawRows.slice(1).entries()) {
    const isEmptyRow = row.every((cell) => !cell || !cell.trim());

    if (isEmptyRow) {
      continue;
    }

    const item: Record<string, unknown> = {};

    for (
      let columnIndex = 0;
      columnIndex < validKeys.length;
      columnIndex += 1
    ) {
      const key = validKeys[columnIndex];

      if (!key) {
        continue;
      }

      setNestedValue(item, key, row[columnIndex] ?? "");
    }

    setFallbackValues(item, sheetId, rowIndex);

    responseData.push(item);
  }

  return responseData as T[];
}

// =====================================================
// Tantou
// =====================================================

function getFirstValue(
  row: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== EMPTY_VALUE
    ) {
      return String(value);
    }
  }

  return EMPTY_VALUE;
}

export function buildDailyDetails(
  rowObj: Record<string, unknown>,
): TantouDailyDetails {
  return {
    hayaban: getFirstValue(rowObj, ["hayaban"]),
    shikai: getFirstValue(rowObj, ["shikai"]),
    uketsuke: getFirstValue(rowObj, ["uketsuke", "uketuke"]),
    denwa: getFirstValue(rowObj, ["denwa"]),
    nimotsu: getFirstValue(rowObj, ["nimotsu"]),
    "2F": getFirstValue(rowObj, ["2F", "floor2F", "floor2f"]),
    "3F": getFirstValue(rowObj, ["3F", "floor3F", "floor3f"]),
    tensou: getFirstValue(rowObj, ["tensou"]),
    amAttendanceRate: getFirstValue(rowObj, [
      "amAttendanceRate",
      "amAttendance",
    ]),
    pmAttendanceRate: getFirstValue(rowObj, [
      "pmAttendanceRate",
      "pmAttendance",
    ]),
  };
}

export function parseTantouSheet(rawRows: string[][]): Tantou {
  const parsedRows = parseRawSheetRows<Record<string, unknown>>(
    rawRows,
    SHEET_IDS.TANTOU,
  );

  return {
    id: "tantou_singleton",
    today: buildDailyDetails(parsedRows[0] ?? {}),
    tomorrow: buildDailyDetails(parsedRows[1] ?? {}),
  };
}

// =====================================================
// Sheet Type
// =====================================================

const SHEET_TYPE_BY_ID: Record<SheetId, SheetType> = {
  [SHEET_IDS.SHOP]: "Store",
  [SHEET_IDS.KOKYUHYO]: "Kokyuhyo",
  [SHEET_IDS.JUGYOIN]: "Jugyoin",
  [SHEET_IDS.TANTOU]: "Tantou",
};

export function getSheetTypeBySheetId(sheetId: SheetId): SheetType {
  return SHEET_TYPE_BY_ID[sheetId] ?? "Raw";
}

// =====================================================
// Google Sheets API
// =====================================================

interface GoogleSheetValuesResponse {
  values?: string[][];
}

interface FetchSheetResult {
  status: number;
  data?: SheetDataResponse;
  errorText?: string;
}

export async function fetchSheetValues(
  sheetId: SheetId,
  accessToken: string,
): Promise<FetchSheetResult> {
  const { dynamicRange, keyMap } = getSheetRangeConfig(sheetId);

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${MASTER_SPREADSHEET_ID}/values/` +
    `${encodeURIComponent(dynamicRange)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    return { status: 401 };
  }

  if (!response.ok) {
    return {
      status: response.status,
      errorText: await response.text(),
    };
  }

  const json = (await response.json()) as GoogleSheetValuesResponse;

  const rawRows = json.values ?? [];

  if (sheetId === SHEET_IDS.TANTOU) {
    return {
      status: 200,
      data: {
        sheetType: "Tantou",
        data: [parseTantouSheet(rawRows)],
      },
    };
  }

  return {
    status: 200,
    data: {
      sheetType: getSheetTypeBySheetId(sheetId),
      data: parseRawSheetRows(rawRows, sheetId, keyMap),
    },
  };
}
