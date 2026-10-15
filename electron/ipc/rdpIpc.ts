// electron/ipc/rdpIpc.ts

import { ipcMain } from "electron";
import { launchRdp } from "@electron/features/rdp/rdpConnection";
import {
  findRdpTarget,
  getRdpTargets,
} from "@electron/features/rdp/rdpResolver";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";

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
      const target = await findRdpTarget(name);
      await launchRdp({
        ipAddress: target.ipAddress,
        userName: target.userName,
        password: target.password,
      });
      return null;
    },
  );
}
