// src/renderer/services/spreadsheetIpcService.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { SpreadsheetMasterData } from "@shared/types/masterData/spreadsheetMasterDataTypes";

/**
 * Google スプレッドシートマスタデータ取得の IPC 通信を集約するサービス
 */
export const spreadsheetIpcService = {
  /** スプレッドシートの全マスタデータを取得する */
  getMasterData: (): Promise<SpreadsheetMasterData> =>
    window.electronAPI.invoke(IPC_CHANNELS.SPREADSHEET.GET_MASTER_DATA),
};
