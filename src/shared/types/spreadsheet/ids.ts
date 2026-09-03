export const MASTER_SPREADSHEET_ID =
  "1TFQ0qoXvr1PW80BBNbYZ2dyVDusQCarknrrqJi50HBc";

export const SHEET_IDS = {
  SHOP: "StoreMasterData",
  KOKYUHYO: "KokyuhyoMasterData",
  JUGYOIN: "JugyoinMasterData",
  TANTOU: "KokyuhyoTantouMasterData",
} as const;

export type SheetId = (typeof SHEET_IDS)[keyof typeof SHEET_IDS];

export const SHEET_TYPES = {
  Store: "Store",
  Kokyuhyo: "Kokyuhyo",
  Jugyoin: "Jugyoin",
  Tantou: "Tantou",
} as const;

export type SheetType = (typeof SHEET_TYPES)[keyof typeof SHEET_TYPES] | "Raw";
