// src/renderer/features/spreadSheet/services/spreadsheetConfig.ts

export interface SheetConfig {
  sheetName: string;
}

export const SPREADSHEET_CONFIGS = {
  StoreMasterData: {
    sheetName: "StoreMasterData",
  },

  KokyuhyoMasterData: {
    sheetName: "KokyuhyoMasterData",
  },

  JugyoinList: {
    sheetName: "JugyoinMasterData",
  },

  KokyuhyoTantouMasterData: {
    sheetName: "KokyuhyoTantouMasterData",
  },
} as const;

export type SheetId = keyof typeof SPREADSHEET_CONFIGS;

export const ALL_SHEET_IDS = Object.keys(SPREADSHEET_CONFIGS) as SheetId[];
