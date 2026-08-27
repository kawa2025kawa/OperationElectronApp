// src/renderer/features/spreadSheet/helpers/spreadsheetMapper.ts

import { getSheetRangeConfig } from "@renderer/features/spreadSheet/services/spreadsheetConfig";
import {
  MASTER_SPREADSHEET_ID,
  SHEET_IDS,
  SHEET_TYPES,
  type SheetDataResponse,
  type SheetId,
  type SheetType,
  type Tantou,
  type TantouDailyDetails,
} from "@shared/types/spreadsheetTypes";

const EMPTY_VALUE = "-";

function sanitizeHeader(text: string): string {
  return text ? text.replace(/[\r\n\t\s]+/g, "").trim() : "";
}

function setNestedValue(
  target: Record<string, unknown>,
  path: string,
  value: string,
): void {
  const keys = path.split(".");
  let current = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue;
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const finalKey = keys[keys.length - 1];
  if (finalKey) {
    current[finalKey] = value.trim() || EMPTY_VALUE;
  }
}

function parseRawSheetRows<T = Record<string, unknown>>(
  rawRows: string[][],
  sheetId: SheetId,
  keyMap?: Record<string, string>,
): T[] {
  if (rawRows.length <= 1) return [];

  const headers = rawRows[0] ?? [];
  const validKeys = headers.map((h) => {
    const sanitized = sanitizeHeader(h);
    return sanitized ? (keyMap?.[sanitized] ?? sanitized) : "";
  });

  return rawRows.slice(1).reduce<Record<string, unknown>[]>((acc, row, idx) => {
    if (row.every((cell) => !cell || !cell.trim())) return acc;

    const item: Record<string, unknown> = {};
    validKeys.forEach((key, colIdx) => {
      if (key) setNestedValue(item, key, row[colIdx] ?? "");
    });

    if (!item.id || item.id === EMPTY_VALUE) {
      const fallbackId = `${sheetId}_row_${idx + 1}`;
      item.id =
        item.code && item.code !== EMPTY_VALUE
          ? `${item.code}_${fallbackId}`
          : fallbackId;
    }

    const start =
      typeof item.businessHoursStart === "string"
        ? item.businessHoursStart
        : "";
    const end =
      typeof item.businessHoursEnd === "string" ? item.businessHoursEnd : "";
    if (start || end) {
      item.businessHours = `${start || "00:00"} ～ ${end || "24:00"}`;
    }

    acc.push(item);
    return acc;
  }, []) as T[];
}

function getFirstValue(
  row: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const val = row[key];
    if (
      val !== undefined &&
      val !== null &&
      val !== "" &&
      val !== EMPTY_VALUE
    ) {
      return String(val);
    }
  }
  return EMPTY_VALUE;
}

function buildDailyDetails(
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

function parseTantouSheet(rawRows: string[][]): Tantou {
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

const SHEET_TYPE_BY_ID: Record<SheetId, SheetType> = {
  [SHEET_IDS.SHOP]: SHEET_TYPES.Store,
  [SHEET_IDS.KOKYUHYO]: SHEET_TYPES.Kokyuhyo,
  [SHEET_IDS.JUGYOIN]: SHEET_TYPES.Jugyoin,
  [SHEET_IDS.TANTOU]: SHEET_TYPES.Tantou,
};

export interface FetchSheetResult {
  status: number;
  data?: SheetDataResponse;
  errorText?: string;
}

export async function fetchSheetValues(
  sheetId: SheetId,
  accessToken: string,
): Promise<FetchSheetResult> {
  const { dynamicRange, keyMap } = getSheetRangeConfig(sheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SPREADSHEET_ID}/values/${encodeURIComponent(dynamicRange)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) return { status: 401 };
  if (!res.ok) return { status: res.status, errorText: await res.text() };

  const json = await res.json();
  const rawRows = json.values ?? [];

  if (sheetId === SHEET_IDS.TANTOU) {
    return {
      status: 200,
      data: {
        sheetType: SHEET_TYPES.Tantou,
        data: [parseTantouSheet(rawRows)],
      },
    };
  }

  return {
    status: 200,
    data: {
      sheetType: SHEET_TYPE_BY_ID[sheetId] ?? "Raw",
      data: parseRawSheetRows(rawRows, sheetId, keyMap),
    },
  };
}
