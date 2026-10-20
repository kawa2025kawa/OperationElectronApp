// electron/ipc/rdpIpc.ts

import { ipcMain } from "electron";
import {
  getRdpTargets,
  startRdpSession,
} from "@electron/features/rdp/rdpService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

// RDPマスタ一覧取得および接続起動に関するIPCハンドラーを登録する。
export function registerRdpIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.RDP.GET_MASTERS,
    async (): Promise<RdpMaster[]> => {
      return getRdpTargets();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.RDP.START_SESSION,
    async (_event, { name }: { name: string }): Promise<null> => {
      await startRdpSession(name);
      return null;
    },
  );
}
