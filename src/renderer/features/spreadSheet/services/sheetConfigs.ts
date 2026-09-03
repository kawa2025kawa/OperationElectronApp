import { SHEET_IDS, type SheetId } from "@shared/types/spreadsheet";

export interface SheetConfig {
  headerRow: number;
  dynamicRange: string;
  keyMap?: Record<string, string>;
}

export const SPREADSHEET_CONFIGS: Record<SheetId, SheetConfig> = {
  [SHEET_IDS.SHOP]: {
    headerRow: 1,
    dynamicRange: "StoreMasterData!A1:BI10000",
  },
  [SHEET_IDS.TANTOU]: {
    headerRow: 2,
    dynamicRange: "KokyuhyoTantouMasterData!A2:J10000",
  },
  [SHEET_IDS.KOKYUHYO]: {
    headerRow: 3,
    dynamicRange: "KokyuhyoMasterData!A3:M10000",
  },
  [SHEET_IDS.JUGYOIN]: {
    headerRow: 3,
    dynamicRange: "JugyoinMasterData!A3:N10000",
  },
};
