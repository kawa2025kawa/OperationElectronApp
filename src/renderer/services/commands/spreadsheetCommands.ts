// src/renderer/services/commands/spreadsheetCommands.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

export const spreadsheetCommands = {
  fetchMaster() {
    return window.electronAPI.invoke(IPC_CHANNELS.SPREADSHEET.MASTER);
  },
} as const;
