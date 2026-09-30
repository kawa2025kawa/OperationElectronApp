// src/renderer/features/remoteDesktop/services/rdpService.ts

import { rdpCommands } from "@renderer/services/commands";
import type { RdpMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

export const rdpService = {
  async fetchTargets(): Promise<RdpMaster[]> {
    return rdpCommands.getRdpMasters();
  },

  async startSession(name: string): Promise<void> {
    await rdpCommands.startRdpSession(name);
  },
};
