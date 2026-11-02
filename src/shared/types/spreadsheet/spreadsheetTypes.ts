// src/shared/types/spreadsheet/spreadsheetTypes.ts

import type { Jugyoin } from "./jugyoin";
import type { Kokyuhyo } from "./kokyuhyo";
import type { Shop } from "./shop";
import type { Tantou } from "./tantou";
import type {
  IrregularMaster,
  OperationMaster,
} from "@shared/types/operation/operationTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

/* =========================
 * Spreadsheet ID
 * ========================= */

export const SPREADSHEET_ID = {
  MASTER: "1VdlHfI2Z3eker8vvqTNEeO0rI5kqV-d_6UlRZOHNV2Q",
} as const;

/* =========================
 * Sheet Definitions
 * ========================= */

export const SHEETS = {
  STORE: {
    sheetName: "StoreMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  KOKYUHYO: {
    sheetName: "KokyuhyoMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  JUGYOIN: {
    sheetName: "JugyoinMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  KOKYUHYO_TANTOU: {
    sheetName: "KokyuhyoTantouMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  OPERATION: {
    sheetName: "OperationMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  IRREGULAR: {
    sheetName: "IrregularMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
  RDP: {
    sheetName: "RdpMasterData",
    spreadsheetId: SPREADSHEET_ID.MASTER,
  },
} as const;

/* =========================
 * Sheet Mapping
 * ========================= */

type SheetDefinition = (typeof SHEETS)[keyof typeof SHEETS];

export type SheetId = SheetDefinition["sheetName"];

type SheetRowMap = {
  [SHEETS.STORE.sheetName]: Shop;
  [SHEETS.KOKYUHYO.sheetName]: Kokyuhyo;
  [SHEETS.JUGYOIN.sheetName]: Jugyoin;
  [SHEETS.KOKYUHYO_TANTOU.sheetName]: Tantou;
  [SHEETS.OPERATION.sheetName]: OperationMaster;
  [SHEETS.IRREGULAR.sheetName]: IrregularMaster;
  [SHEETS.RDP.sheetName]: RdpMaster;
};

export type SheetRow<TSheetId extends SheetId> = SheetRowMap[TSheetId];

export type SheetData<TSheetId extends SheetId> = SheetRow<TSheetId>[];

export type SpreadSheetEntity = SheetRow<SheetId>;

/* =========================
 * Renderer Sheet State
 * ========================= */

export interface SheetDataResponse<TSheetId extends SheetId> {
  sheetId: TSheetId;
  data: SheetData<TSheetId>;
}

export type SheetDataState = {
  [TSheetId in SheetId]: SheetDataResponse<TSheetId> | null;
};
