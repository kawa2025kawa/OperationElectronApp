// electron/ipc/spreadsheetIpc.ts

import { ipcMain } from "electron";
import {
  getFilteredSheetData,
  getSpreadsheetMasterData,
} from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";

export function registerSpreadsheetIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA,
    async (): Promise<SpreadsheetMasterData> => {
      return getSpreadsheetMasterData();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SPREADSHEET.GET_FILTERED_DATA,
    async (
      _event,
      params: {
        sheetName: string;
        searchTerm?: string;
        searchKeys?: string[];
      },
    ) => {
      return getFilteredSheetData(
        params.sheetName,
        params.searchTerm ?? "",
        params.searchKeys ?? [],
      );
    },
  );
}
