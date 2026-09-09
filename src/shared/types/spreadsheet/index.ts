// src/shared/types/spreadsheet/index.ts

export * from "./common";
export * from "./shop";
export * from "./kokyuhyo";
export * from "./jugyoin";
export * from "./tantou";
export * from "./ui";

import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";

/**
 * アプリ内で使用するスプレッドシートの識別IDマッピング
 * ※ キー名をアプリ側の統一ID (JugyoinList) に揃えます
 */
export type SheetRowMap = {
  StoreMasterData: Shop;
  KokyuhyoMasterData: Kokyuhyo;
  JugyoinMasterData: Jugyoin;
  KokyuhyoTantouMasterData: Tantou;
};

/**
 * アプリ内で回遊・指定するスプレッドシートID型
 */
export type SheetId = keyof SheetRowMap;

export interface SheetDataResponse {
  sheetType: "Store" | "Kokyuhyo" | "Jugyoin" | "Tantou" | "Raw";
  data: unknown[];
}
