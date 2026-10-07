// electron/features/rdp/rdpIpc.ts

import { ipcMain } from "electron";

import { getRdpTargets, findRdpTarget } from "./rdpResolver";
import { launchRdp } from "./rdpConnection";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

let registered = false;

interface StartRdpSessionRequest {
  payload?: {
    name?: string;
  };
}

export function registerRdpIpc(): void {
  if (registered) return;

  registered = true;

  ipcMain.handle(IPC_CHANNELS.RDP.GET_MASTERS, async () => {
    return getRdpTargets();
  });

  ipcMain.handle(
    IPC_CHANNELS.RDP.START_SESSION,
    async (_event, request: StartRdpSessionRequest) => {
      const name = request?.payload?.name?.trim();

      if (!name) {
        throw new Error("RDP target name is required");
      }

      const target = await findRdpTarget(name);

      await launchRdp({
        ipAddress: target.ipAddress,
        userName: target.userName,
        password: target.password,
      });
    },
  );
}
