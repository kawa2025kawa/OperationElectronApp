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

export const sanitizeHeader = (text: string): string =>
  text ? text.replace(/[\r\n\t\s]+/g, "").trim() : "";

const setNestedValue = (
  target: Record<string, unknown>,
  path: string,
  value: string,
): void => {
  const keys = path.split(".");
  let current = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value.trim() || "-";
};

const setFallbackIdAndBusinessHours = (
  item: Record<string, unknown>,
  sheetId: SheetId,
  rowIndex: number,
): void => {
  if (!item.id || item.id === "-") {
    const fallbackId = `${sheetId}_row_${rowIndex + 1}`;
    item.id =
      typeof item.code === "string" && item.code && item.code !== "-"
        ? `${item.code}_${fallbackId}`
        : fallbackId;
  }

  const openTime = item.businessHoursStart as string | undefined;
  const closeTime = item.businessHoursEnd as string | undefined;
  const hasOpen = Boolean(openTime && openTime !== "-");
  const hasClose = Boolean(closeTime && closeTime !== "-");

  if (hasOpen || hasClose) {
    item.businessHours = `${hasOpen ? openTime : "00:00"} ? ${hasClose ? closeTime : "24:00"}`;
  }
};

export const parseRawSheetRows = <T = Record<string, unknown>>(
  rawRows: string[][],
  sheetId: SheetId,
  keyMap?: Record<string, string>,
): T[] => {
  if (!rawRows.length) return [];

  const validKeys = (rawRows[0] ?? []).map((keyText) => {
    const sanitized = sanitizeHeader(keyText);
    return sanitized ? keyMap?.[sanitized] || sanitized : "";
  });

  const responseData: Record<string, unknown>[] = [];

  rawRows.slice(1).forEach((row, rowIndex) => {
    if (row.every((cell) => !cell || !cell.trim())) return;

    const item: Record<string, unknown> = {};
    validKeys.forEach((key, colIndex) => {
      if (key) setNestedValue(item, key, row[colIndex] ?? "");
    });

    setFallbackIdAndBusinessHours(item, sheetId, rowIndex);
    responseData.push(item);
  });

  return responseData as T[];
};

export const buildDailyDetails = (
  rowObj: Record<string, unknown>,
): TantouDailyDetails => {
  const getVal = (...keys: string[]): string => {
    for (const k of keys) {
      const v = rowObj[k];
      if (v !== undefined && v !== null && v !== "" && v !== "-")
        return String(v);
    }
    return "-";
  };

  return {
    hayaban: getVal("hayaban"),
    shikai: getVal("shikai"),
    uketsuke: getVal("uketsuke", "uketuke"),
    denwa: getVal("denwa"),
    nimotsu: getVal("nimotsu"),
    "2F": getVal("2F", "floor2F", "floor2f"),
    "3F": getVal("3F", "floor3F", "floor3f"),
    tensou: getVal("tensou"),
    amAttendanceRate: getVal("amAttendanceRate", "amAttendance"),
    pmAttendanceRate: getVal("pmAttendanceRate", "pmAttendance"),
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SPREADSHEET_ID}/values/${encodeURIComponent(dynamicRange)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (response.status === 401) return { status: 401 };
  if (!response.ok)
    return { status: response.status, errorText: await response.text() };

  const json = (await response.json()) as { values?: string[][] };
  const rawRows = json.values ?? [];

  if (sheetId === SHEET_IDS.TANTOU) {
    return {
      status: 200,
      data: { sheetType: "Tantou", data: [parseTantouSheet(rawRows)] },
    };
  }

  return {
    status: 200,
    data: {
      sheetType: getSheetTypeBySheetId(sheetId),
      data: parseRawSheetRows(rawRows, sheetId, keyMap),
    },
  };
};
