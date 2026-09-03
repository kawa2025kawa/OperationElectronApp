// src/shared/types/spreadsheet/index.ts
export * from "./ids";
export * from "./common";
export * from "./shop";
export * from "./kokyuhyo";
export * from "./jugyoin";
export * from "./tantou";
export * from "./ui"; // ← 追加

import type { SHEET_IDS, SheetType } from "./ids";
import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";

export type SheetRowMap = {
  [SHEET_IDS.SHOP]: Shop;
  [SHEET_IDS.KOKYUHYO]: Kokyuhyo;
  [SHEET_IDS.JUGYOIN]: Jugyoin;
  [SHEET_IDS.TANTOU]: Tantou;
};

export interface SheetDataResponse {
  sheetType: SheetType;
  data: unknown[];
}
