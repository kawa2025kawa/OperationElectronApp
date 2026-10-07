//electron\features\spreadsheet\ipc\spreadsheetIpc.ts
import { ipcMain } from "electron";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

import { getMasterData } from "../application/masterDataManager";

let registered = false;

export function registerSpreadsheetIpc(): void {
  if (registered) return;

  registered = true;

  ipcMain.handle(IPC_CHANNELS.SPREADSHEET.MASTER, async () => {
    return getMasterData();
  });

  console.log("[IPC] Spreadsheet handlers registered.");
}
