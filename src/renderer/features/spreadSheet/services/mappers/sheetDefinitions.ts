// src/renderer/features/spreadSheet/services/mappers/sheetDefinitions.ts

import type {
  SheetDataResponse,
  SheetId,
  SheetRowMap,
  SheetTypeMap,
} from "@shared/types/spreadsheet/sheetTypes";

import {
  parseJugyoinSheet,
  parseKokyuhyoSheet,
  parseShopSheet,
  parseTantouSheet,
} from "./domain/spreadsheetMapper";

import { parseOperationMasterSheet } from "./domain/operationMapper";

import { fetchRawSheetValues } from "../spreadsheetApi";

export interface FetchSheetResult<TSheetId extends SheetId = SheetId> {
  status: number;
  data?: SheetDataResponse<TSheetId>;
  errorText?: string;
}

interface SheetDefinition<TSheetId extends SheetId> {
  spreadsheetId: string;
  range: string;
  type: SheetTypeMap[TSheetId];
  parse: (values: string[][]) => SheetRowMap[TSheetId][];
}

type SheetDefinitionMap = {
  [TSheetId in SheetId]: SheetDefinition<TSheetId>;
};

/**
 * シート設定・通信範囲・パース処理を一括定義。
 *
 * SheetId と parser の戻り値の型が
 * 一致していることを TypeScript に保証させる。
 */
export const SHEET_DEFINITIONS: SheetDefinitionMap = {
  KokyuhyoMasterData: {
    spreadsheetId: "19CYXIor7Zz3i0KfNY1t5gDKWRU62o2Sq1Tp5iBgaocc",
    range: "KokyuhyoMasterData",
    type: "Kokyuhyo",
    parse: parseKokyuhyoSheet,
  },

  KokyuhyoTantouMasterData: {
    spreadsheetId: "19CYXIor7Zz3i0KfNY1t5gDKWRU62o2Sq1Tp5iBgaocc",
    range: "KokyuhyoTantouMasterData",
    type: "Tantou",
    parse: parseTantouSheet,
  },

  JugyoinMasterData: {
    spreadsheetId: "1DdhzdvH-Z33sK6Zfk8_ZHBqVBmB0MxD9su0NVbge8gI",
    range: "JugyoinMasterData",
    type: "Jugyoin",
    parse: parseJugyoinSheet,
  },

  StoreMasterData: {
    spreadsheetId: "1VYh6hj7_j17edeAIpAntvFQIcFMojosuUtj_PXDbXc0",
    range: "StoreMasterData",
    type: "Store",
    parse: parseShopSheet,
  },

  OperationMasterList: {
    spreadsheetId: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
    range: "OperationMasterList",
    type: "Operation",
    parse: parseOperationMasterSheet,
  },

  IrregularMasterList: {
    spreadsheetId: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
    range: "IrregularMasterList",
    type: "Irregular",
    parse: parseOperationMasterSheet,
  },

  TodayIrregularMasterList: {
    spreadsheetId: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
    range: "TodayIrregularMasterList",
    type: "Today",
    parse: parseOperationMasterSheet,
  },
};

export const ALL_SHEET_IDS = Object.keys(
  SHEET_DEFINITIONS,
) as readonly SheetId[];

/**
 * 指定されたシートを取得し、
 * raw values をドメインモデルへ変換する。
 */
export async function fetchSheetValues<TSheetId extends SheetId>(
  sheetId: TSheetId,
  accessToken: string,
): Promise<FetchSheetResult<TSheetId>> {
  const def = SHEET_DEFINITIONS[sheetId];

  if (!def) {
    return {
      status: 400,
      errorText: `未定義のシートIDです: ${sheetId}`,
    };
  }

  const apiRes = await fetchRawSheetValues(
    def.spreadsheetId,
    def.range,
    accessToken,
  );

  if (apiRes.status !== 200 || !apiRes.values) {
    return {
      status: apiRes.status,
      errorText: apiRes.errorText,
    };
  }

  const data = def.parse(apiRes.values);

  return {
    status: 200,
    data: {
      sheetType: def.type,
      data,
    },
  };
}
