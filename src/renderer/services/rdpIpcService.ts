// src/renderer/services/rdpIpcService.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { RdpTarget } from "@shared/types/rdp/rdpTypes";

/** RDP 関連の IPC 通信 */
export const rdpIpcService = {
  /** RDP 接続先一覧を取得する */
  getMasters: (): Promise<RdpTarget[]> =>
    window.electronAPI.invoke(IPC_CHANNELS.RDP.GET_MASTERS),

  /** 指定名称の端末へ RDP セッションを開始する */
  startSession: (name: string): Promise<null> =>
    window.electronAPI.invoke(IPC_CHANNELS.RDP.START_SESSION, { name }),
};
