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

const setNestedValue = (
  target: Record<string, unknown>,
  path: string,
  value: string,
): void => {
  const keys = path.split(".");
  let current = target;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];

    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  }

  const key = keys[keys.length - 1];
  const sanitizedValue = value.trim();

  current[key] = sanitizedValue || "-";
};

const isEmptyRow = (row: string[]): boolean =>
  row.every((cell) => !cell || cell.trim() === "");

const buildValidKeys = (
  headerRow: string[],
  keyMap?: Record<string, string>,
): string[] =>
  headerRow.map((keyText) => {
    const sanitized = sanitizeHeader(keyText);

    if (!sanitized) {
      return "";
    }

    return keyMap?.[sanitized] || sanitized;
  });

const buildFallbackId = (
  item: Record<string, unknown>,
  sheetId: SheetId,
  rowIndex: number,
): string => {
  const fallbackId = `${sheetId}_row_${rowIndex + 1}`;

  if (typeof item.code === "string" && item.code && item.code !== "-") {
    return `${item.code}_${fallbackId}`;
  }

  return fallbackId;
};

const setFallbackId = (
  item: Record<string, unknown>,
  sheetId: SheetId,
  rowIndex: number,
): void => {
  if (!item.id || item.id === "-") {
    item.id = buildFallbackId(item, sheetId, rowIndex);
  }
};

const setBusinessHours = (item: Record<string, unknown>): void => {
  const openTime = item.businessHoursStart as string | undefined;
  const closeTime = item.businessHoursEnd as string | undefined;

  const hasOpenTime = Boolean(openTime && openTime !== "-");
  const hasCloseTime = Boolean(closeTime && closeTime !== "-");

  if (!hasOpenTime && !hasCloseTime) {
    return;
  }

  item.businessHours = `${
    hasOpenTime ? openTime : "00:00"
  } ? ${hasCloseTime ? closeTime : "24:00"}`;
};

export const parseRawSheetRows = <T = Record<string, unknown>>(
  rawRows: string[][],
  sheetId: SheetId,
  keyMap?: Record<string, string>,
): T[] => {
  if (rawRows.length === 0) {
    return [];
  }

  const validKeys = buildValidKeys(rawRows[0] ?? [], keyMap);
  const responseData: Record<string, unknown>[] = [];

  rawRows.slice(1).forEach((row, rowIndex) => {
    if (isEmptyRow(row)) {
      return;
    }

    const item: Record<string, unknown> = {};

    validKeys.forEach((key, columnIndex) => {
      if (!key) {
        return;
      }

      setNestedValue(item, key, row[columnIndex] ?? "");
    });

    setFallbackId(item, sheetId, rowIndex);
    setBusinessHours(item);

    responseData.push(item);
  });

  return responseData as T[];
};

export const buildDailyDetails = (
  rowObj: Record<string, unknown>,
): TantouDailyDetails => {
  const getStringValue = (...keys: string[]): string => {
    for (const key of keys) {
      const value = rowObj[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "-"
      ) {
        return String(value);
      }
    }

    return "-";
  };

  return {
    hayaban: getStringValue("hayaban"),
    shikai: getStringValue("shikai"),
    uketsuke: getStringValue("uketsuke", "uketuke"),
    denwa: getStringValue("denwa"),
    nimotsu: getStringValue("nimotsu"),
    "2F": getStringValue("2F", "floor2F", "floor2f"),
    "3F": getStringValue("3F", "floor3F", "floor3f"),
    tensou: getStringValue("tensou"),
    amAttendanceRate: getStringValue("amAttendanceRate", "amAttendance"),
    pmAttendanceRate: getStringValue("pmAttendanceRate", "pmAttendance"),
  };
};

export const parseTantouSheet = (rawRows: string[][]): Tantou => {
  const parsedRows = parseRawSheetRows<Record<string, unknown>>(
    rawRows,
    SHEET_IDS.TANTOU,
  );

  return {
    id: "tantou_singleton",
    today: buildDailyDetails(parsedRows[0] ?? {}),
    tomorrow: buildDailyDetails(parsedRows[1] ?? {}),
  };
};

export const getSheetTypeBySheetId = (sheetId: SheetId): SheetType => {
  const typeMapping: Record<SheetId, SheetType> = {
    [SHEET_IDS.SHOP]: "Store",
    [SHEET_IDS.KOKYUHYO]: "Kokyuhyo",
    [SHEET_IDS.JUGYOIN]: "Jugyoin",
    [SHEET_IDS.TANTOU]: "Tantou",
  };

  return typeMapping[sheetId] ?? "Raw";
};

export const fetchSheetValues = async (
  sheetId: SheetId,
  token: string,
): Promise<{
  status: number;
  data?: SheetDataResponse;
  errorText?: string;
}> => {
  const { dynamicRange, keyMap } = getSheetRangeConfig(sheetId);

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${MASTER_SPREADSHEET_ID}/values/${encodeURIComponent(dynamicRange)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
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

  const json = (await response.json()) as {
    values?: string[][];
  };

  const rawRows = json.values ?? [];

  if (sheetId === SHEET_IDS.TANTOU) {
    const tantouData = parseTantouSheet(rawRows);

    return {
      status: 200,
      data: {
        sheetType: "Tantou",
        data: [tantouData],
      },
    };
  }

  const responseData = parseRawSheetRows(rawRows, sheetId, keyMap);

  return {
    status: 200,
    data: {
      sheetType: getSheetTypeBySheetId(sheetId),
      data: responseData,
    },
  };
};
