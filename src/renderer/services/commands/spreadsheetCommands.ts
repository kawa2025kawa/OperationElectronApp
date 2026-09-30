// src/renderer/services/commands/spreadsheetCommands.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { SheetId } from "@shared/types/spreadsheet/spreadsheetTypes";

export const spreadsheetCommands = {
  fetchSheet<TSheetId extends SheetId>(sheetId: TSheetId) {
    return window.electronAPI.invoke(
      IPC_CHANNELS.SPREADSHEET.FETCH_SHEET,
      sheetId,
    );
  },
} as const;
