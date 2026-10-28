// electron/ipc/spreadsheetIpc.ts

import { ipcMain } from "electron";
import { getSpreadsheetMasterData } from "@electron/features/masterData/application/spreadsheetMasterDataManager";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

// スプレッドシートマスタデータ取得に関するIPCハンドラーを登録する。
export function registerSpreadsheetIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA]["return"]
    > => {
      return getSpreadsheetMasterData();
    },
  );
}
