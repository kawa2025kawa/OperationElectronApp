// electron/ipc/rdpIpc.ts

import { ipcMain } from "electron";
import {
  getRdpTargets,
  startRdpSession,
} from "@electron/features/rdp/rdpService";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { IpcChannelMap } from "@shared/types/electron/ipcTypes";

// RDPマスタ一覧取得および接続起動に関するIPCハンドラーを登録する。
export function registerRdpIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.RDP.GET_MASTERS,
    async (): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.RDP.GET_MASTERS]["return"]
    > => {
      return getRdpTargets();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.RDP.START_SESSION,
    async (
      _event,
      { name }: IpcChannelMap[typeof IPC_CHANNELS.RDP.START_SESSION]["args"][0],
    ): Promise<
      IpcChannelMap[typeof IPC_CHANNELS.RDP.START_SESSION]["return"]
    > => {
      await startRdpSession(name);
      return null;
    },
  );
}
