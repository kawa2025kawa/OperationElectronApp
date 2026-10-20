// src/renderer/services/rdpIpcService.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

/**
 * リモートデスクトップ（RDP）関連の IPC 通信を集約するサービス
 */
export const rdpIpcService = {
  /** RDP接続先一覧を取得する */
  getMasters: (): Promise<RdpMaster[]> =>
    window.electronAPI.invoke(IPC_CHANNELS.RDP.GET_MASTERS),

  /** 指定名称の端末へRDPセッションを開始する */
  startSession: (name: string): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.RDP.START_SESSION, { name }),
};
