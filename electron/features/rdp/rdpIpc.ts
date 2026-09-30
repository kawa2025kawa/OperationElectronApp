// electron/features/rdp/rdpIpc.ts

import { execFile } from "node:child_process";
import util from "node:util";
import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { getRdpMaster, loadRdpMasters } from "./rdpMasterService";

const execFilePromise = util.promisify(execFile);
let registered = false;

export function registerRdpIpc(): void {
  if (registered) return;
  registered = true;

  ipcMain.handle(IPC_CHANNELS.RDP.GET_MASTERS, async () => loadRdpMasters());

  ipcMain.handle(
    IPC_CHANNELS.RDP.START_SESSION,
    async (_event, { payload }: { payload: { name: string } }) => {
      const name = payload?.name?.trim();

      if (!name) {
        throw new Error("RDP target name is required");
      }

      const master = getRdpMaster(name);

      if (!master) {
        throw new Error(`RDP target not found: ${name}`);
      }

      if (master.userName && master.password) {
        await execFilePromise("cmdkey", [
          `/generic:TERMSRV/${master.ipAddress}`,
          `/user:${master.userName}`,
          `/pass:${master.password}`,
        ]);
      }

      execFile("mstsc", [`/v:${master.ipAddress}`]);

      return null;
    },
  );
}
