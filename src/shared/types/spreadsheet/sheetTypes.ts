// src/shared/types/spreadsheet/sheetTypes.ts

import type { OperationItem } from "../operation/operationTypes";
import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";

/**
 * SheetId ごとの1行分のドメイン型。
 */
export type SheetRowMap = {
  StoreMasterData: Shop;
  KokyuhyoMasterData: Kokyuhyo;
  JugyoinMasterData: Jugyoin;
  KokyuhyoTantouMasterData: Tantou;
  OperationMasterList: OperationItem;
  IrregularMasterList: OperationItem;
  TodayIrregularMasterList: OperationItem;
};

export type SheetId = keyof SheetRowMap;

/**
 * SheetId ごとのシート種別。
 */
export type SheetTypeMap = {
  StoreMasterData: "Store";
  KokyuhyoMasterData: "Kokyuhyo";
  JugyoinMasterData: "Jugyoin";
  KokyuhyoTantouMasterData: "Tantou";
  OperationMasterList: "Operation";
  IrregularMasterList: "Irregular";
  TodayIrregularMasterList: "Today";
};

export type SheetType = SheetTypeMap[SheetId];

/**
 * スプレッドシート由来のドメインエンティティ。
 */
export type SpreadSheetEntity = SheetRowMap[SheetId];

/**
 * SheetId に対応する1行の型。
 */
export type SheetRow<TSheetId extends SheetId> = SheetRowMap[TSheetId];

/**
 * SheetId に対応するデータ配列の型。
 */
export type SheetData<TSheetId extends SheetId> = SheetRow<TSheetId>[];

/**
 * SheetId に対応した取得結果。
 *
 * 例:
 *
 * SheetDataResponse<"OperationMasterList">
 *
 * =>
 *
 * {
 *   sheetType: "Operation";
 *   data: OperationItem[];
 * }
 */
export interface SheetDataResponse<TSheetId extends SheetId = SheetId> {
  sheetType: SheetTypeMap[TSheetId];
  data: SheetData<TSheetId>;
}

/**
 * Zustand の sheetData 用型。
 *
 * ここが重要。
 *
 * sheetData.OperationMasterList
 *     -> SheetDataResponse<"OperationMasterList">
 *     -> data: OperationItem[]
 *
 * sheetData.StoreMasterData
 *     -> SheetDataResponse<"StoreMasterData">
 *     -> data: Shop[]
 */
export type SheetDataState = {
  [TSheetId in SheetId]: SheetDataResponse<TSheetId> | null;
};
