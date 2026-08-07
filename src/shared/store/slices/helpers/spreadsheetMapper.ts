// src/shared/store/slices/helpers/spreadsheetMapper.ts

import { getSheetRangeConfig } from "@shared/config/spreadsheetConfig";
import {
  MASTER_SPREADSHEET_ID,
  SHEET_IDS,
  type SheetDataResponse,
  type SheetId,
  type SheetType,
  type Tantou,
  type TantouDailyDetails,
} from "@shared/types/spreadsheetTypes";

export const sanitizeHeader = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[\r\n\t]/g, "")
    .replace(/\s+/g, "")
    .trim();
};

const setNestedValue = (targetObj: Record<string, unknown>, path: string, value: string): void => {
  const keys = path.split(".");
  let current = targetObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const sanitizedValue = value.trim();
  current[keys[keys.length - 1]] = sanitizedValue !== "" ? sanitizedValue : "-";
};

export const parseRawSheetRows = <T = Record<string, unknown>>(
  rawRows: string[][],
  sheetId: SheetId,
  _startRow = 1,
  keyMap?: Record<string, string>,
): T[] => {
  if (!rawRows || rawRows.length === 0) return [];

  const keyHeaderRow = rawRows[0] || [];

  const validKeys = keyHeaderRow.map((keyText) => {
    const sanitized = sanitizeHeader(keyText);
    if (!sanitized) return "";
    return keyMap?.[sanitized] || sanitized;
  });

  const dataRowsOnly = rawRows.slice(1);
  const responseData: Record<string, unknown>[] = [];

  dataRowsOnly.forEach((row, rowIndex) => {
    const isRowEmpty = row.every((cell) => !cell || cell.trim() === "");
    if (isRowEmpty) return;

    const item: Record<string, unknown> = {};

    validKeys.forEach((key, colIndex) => {
      if (!key) return;
      const val = row[colIndex] || "";
      setNestedValue(item, key, val);
    });

    const fallbackId = `${sheetId}_row_${rowIndex + 1}`;
    if (!item.id || item.id === "-") {
      item.id =
        typeof item.code === "string" && item.code && item.code !== "-"
          ? `${item.code}_${fallbackId}`
          : fallbackId;
    }

    const openTime = item.businessHoursStart as string | undefined;
    const closeTime = item.businessHoursEnd as string | undefined;
    if ((openTime && openTime !== "-") || (closeTime && closeTime !== "-")) {
      item.businessHours = `${openTime && openTime !== "-" ? openTime : "00:00"} ～ ${closeTime && closeTime !== "-" ? closeTime : "24:00"}`;
    }

    responseData.push(item);
  });

  return responseData as T[];
};

export const buildDailyDetails = (rowObj: Record<string, unknown>): TantouDailyDetails => {
  const getStr = (...keys: string[]): string => {
    for (const k of keys) {
      const val = rowObj[k];
      if (val !== undefined && val !== null && val !== "" && val !== "-") {
        return String(val);
      }
    }
    return "-";
  };

  return {
    hayaban: getStr("hayaban"),
    shikai: getStr("shikai"),
    uketsuke: getStr("uketsuke", "uketuke"),
    denwa: getStr("denwa"),
    nimotsu: getStr("nimotsu"),
    "2F": getStr("2F", "floor2F", "floor2f"),
    "3F": getStr("3F", "floor3F", "floor3f"),
    tensou: getStr("tensou"),
    amAttendanceRate: getStr("amAttendanceRate", "amAttendance"),
    pmAttendanceRate: getStr("pmAttendanceRate", "pmAttendance"),
  };
};

export const parseTantouSheet = (rawRows: string[][]): Tantou => {
  const parsedRows = parseRawSheetRows<Record<string, unknown>>(rawRows, SHEET_IDS.TANTOU);
  const todayRow = parsedRows[0] || {};
  const tomorrowRow = parsedRows[1] || {};

  return {
    id: "tantou_singleton",
    today: buildDailyDetails(todayRow),
    tomorrow: buildDailyDetails(tomorrowRow),
  };
};

export const getSheetTypeBySheetId = (sheetId: SheetId): SheetType => {
  const typeMapping: Record<SheetId, SheetType> = {
    [SHEET_IDS.SHOP]: "Store",
    [SHEET_IDS.KOKYUHYO]: "Kokyuhyo",
    [SHEET_IDS.JUGYOIN]: "Jugyoin",
    [SHEET_IDS.TANTOU]: "Tantou",
  };
  return typeMapping[sheetId] || "Raw";
};

// 【統合】スプレッドシートデータ取得API関数
export const fetchSheetValues = async (
  sheetId: SheetId,
  token: string,
): Promise<{ status: number; data?: SheetDataResponse; errorText?: string }> => {
  const { headerRow, dynamicRange, keyMap } = getSheetRangeConfig(sheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SPREADSHEET_ID}/values/${encodeURIComponent(dynamicRange)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (res.status === 401) return { status: 401 };
  if (!res.ok) return { status: res.status, errorText: await res.text() };

  const json = (await res.json()) as { values?: string[][] };
  const rawRows = json.values || [];

  if (sheetId === SHEET_IDS.TANTOU) {
    const tantouData = parseTantouSheet(rawRows);
    return {
      status: 200,
      data: { sheetType: "Tantou", data: [tantouData] },
    };
  }

  const responseData = parseRawSheetRows(rawRows, sheetId, headerRow, keyMap);

  return {
    status: 200,
    data: { sheetType: getSheetTypeBySheetId(sheetId), data: responseData },
  };
};
