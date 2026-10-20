// electron/ipc/spreadsheetIpc.ts

import { ipcMain } from "electron";
import { getSpreadsheetMasterData } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";

// スプレッドシートマスタデータ取得に関するIPCハンドラーを登録する。
export function registerSpreadsheetIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA,
    async (): Promise<SpreadsheetMasterData> => {
      return getSpreadsheetMasterData();
    },
  );
}
