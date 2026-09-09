import type { SheetDataResponse, SheetId } from "@shared/types/spreadsheet";
import {
  JUGYOIN_FIELD_LABELS,
  type Jugyoin,
} from "@shared/types/spreadsheet/jugyoin";
import {
  KOKYUHYO_FIELD_LABELS,
  type Kokyuhyo,
} from "@shared/types/spreadsheet/kokyuhyo";
import { SHOP_FIELD_LABELS, type Shop } from "@shared/types/spreadsheet/shop";
import {
  TANTOU_FIELD_LABELS,
  type Tantou,
} from "@shared/types/spreadsheet/tantou";
import { fetchRawSheetValues } from "../spreadsheetApi";

// ============================================================
// 共通定数・ユーティリティ
// ============================================================

export const EMPTY_VALUE = "-";

/**
 * ヘッダー名を正規化
 */
export function sanitizeHeader(text: string): string {
  return text ? text.replace(/[\r\n\t\s]+/g, "").trim() : "";
}

/**
 * 値取得
 */
export function getValue<T extends string | undefined = string>(
  obj: Record<string, string> | undefined,
  keys: readonly string[],
  defaultValue: T = EMPTY_VALUE as T,
): string | T {
  if (!obj) return defaultValue;

  for (const key of keys) {
    const value = obj[key]?.trim();
    if (value && value !== EMPTY_VALUE) {
      return value;
    }
  }

  return defaultValue;
}

/**
 * シートデータをフラットオブジェクトへ変換
 */
export function parseRawToFlatObjects(
  rawRows: string[][],
): Record<string, string>[] {
  if (rawRows.length <= 1) {
    return [];
  }

  const headers = (rawRows[0] ?? []).map(sanitizeHeader);
  const result: Record<string, string>[] = [];

  for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];

    if (!row?.some((cell) => cell?.trim())) {
      continue;
    }

    const item: Record<string, string> = {
      _rowIdx: String(rowIndex),
    };

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const key = headers[colIndex];
      if (key) {
        item[key] = (row[colIndex] ?? "").trim();
      }
    }

    result.push(item);
  }

  return result;
}

/**
 * FIELD_LABELSのキー構造に基づいて自動マッピングする汎用関数
 */
export function parseGenericSheet<T extends Record<string, string>>(
  rawRows: string[][],
  prefix: string,
  fieldKeys: readonly string[],
): T[] {
  const flatRows = parseRawToFlatObjects(rawRows);

  return flatRows.map((flat, idx) => {
    const item: Record<string, string> = {
      id: `${prefix}_row_${flat._rowIdx ?? idx + 1}`,
    };

    for (const key of fieldKeys) {
      if (key === "id") continue;
      item[key] = getValue(flat, [key]);
    }

    return item as T;
  });
}

// ============================================================
// 個別マッパー関数
// ============================================================

export function parseShopSheet(rawRows: string[][]): Shop[] {
  return parseGenericSheet<Shop>(
    rawRows,
    "shop",
    Object.keys(SHOP_FIELD_LABELS),
  );
}

export function parseKokyuhyoSheet(rawRows: string[][]): Kokyuhyo[] {
  return parseGenericSheet<Kokyuhyo>(
    rawRows,
    "kokyuhyo",
    Object.keys(KOKYUHYO_FIELD_LABELS),
  );
}

export function parseJugyoinSheet(rawRows: string[][]): Jugyoin[] {
  return parseGenericSheet<Jugyoin>(
    rawRows,
    "jugyoin",
    Object.keys(JUGYOIN_FIELD_LABELS),
  );
}

export function parseTantouSheet(rawRows: string[][]): Tantou[] {
  return parseGenericSheet<Tantou>(
    rawRows,
    "tantou",
    Object.keys(TANTOU_FIELD_LABELS),
  );
}

// ============================================================
// メインフェッチ・実行定義
// ============================================================

export interface FetchSheetResult {
  status: number;
  data?: SheetDataResponse;
  errorText?: string;
}

type SheetType = "Store" | "Kokyuhyo" | "Jugyoin" | "Tantou";

interface SheetDefinition {
  type: SheetType;
  parse: (values: string[][]) => unknown[];
}

const SHEET_DEFINITIONS: Record<SheetId, SheetDefinition> = {
  StoreMasterData: {
    type: "Store",
    parse: parseShopSheet,
  },
  KokyuhyoMasterData: {
    type: "Kokyuhyo",
    parse: parseKokyuhyoSheet,
  },
  JugyoinMasterData: {
    type: "Jugyoin",
    parse: parseJugyoinSheet,
  },
  KokyuhyoTantouMasterData: {
    type: "Tantou",
    parse: parseTantouSheet,
  },
};

export async function fetchSheetValues(
  sheetId: SheetId,
  accessToken: string,
): Promise<FetchSheetResult> {
  const definition = SHEET_DEFINITIONS[sheetId];
  if (!definition) {
    return {
      status: 400,
      errorText: `未定義のシート定義です: ${sheetId}`,
    };
  }

  const apiRes = await fetchRawSheetValues(sheetId, accessToken);

  if (apiRes.status !== 200 || !apiRes.values) {
    return {
      status: apiRes.status,
      errorText: apiRes.errorText,
    };
  }

  return {
    status: 200,
    data: {
      sheetType: definition.type,
      data: definition.parse(apiRes.values),
    },
  };
}
