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

export type SheetRowMap = {
  StoreMasterData: Shop;
  KokyuhyoMasterData: Kokyuhyo;
  JugyoinMasterData: Jugyoin;
  KokyuhyoTantouMasterData: Tantou;
};

export interface SheetDataResponse {
  sheetType: "Store" | "Kokyuhyo" | "Jugyoin" | "Tantou" | "Raw";
  data: unknown[];
}
