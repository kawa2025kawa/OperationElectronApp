// src/renderer/services/commands/rdpCommands.ts

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

export const rdpCommands = {
  getRdpMasters() {
    return window.electronAPI.invoke(IPC_CHANNELS.RDP.GET_MASTERS);
  },

  startRdpSession(name: string) {
    return window.electronAPI.invoke(IPC_CHANNELS.RDP.START_SESSION, {
      payload: {
        name,
      },
    });
  },
} as const;
