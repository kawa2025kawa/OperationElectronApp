// src/shared/types/spreadsheet/index.ts

export * from "./common";
export * from "./shop";
export * from "./kokyuhyo";
export * from "./jugyoin";
export * from "./tantou";

import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";

/**
 * スプレッドシート系の全エンティティの統合ユニオン型
 */
export type SpreadSheetEntity = Shop | Kokyuhyo | Jugyoin | Tantou;

export type SheetRowMap = {
  StoreMasterData: Shop;
  KokyuhyoMasterData: Kokyuhyo;
  JugyoinMasterData: Jugyoin;
  KokyuhyoTantouMasterData: Tantou;
};

export type SheetId = keyof SheetRowMap;

export interface SheetDataResponse {
  sheetType: "Store" | "Kokyuhyo" | "Jugyoin" | "Tantou" | "Raw";
  data: unknown[];
}
