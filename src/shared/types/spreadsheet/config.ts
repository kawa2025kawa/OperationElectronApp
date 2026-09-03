import type { SheetId } from "./ids";

export interface SheetConfig {
  headerRow: number;
  dynamicRange: string;
  keyMap?: Record<string, string>;
}

export type SpreadsheetConfigs = Record<SheetId, SheetConfig>;
