//src\renderer\features\remoteDesktop\services\rdpService.ts

import { commands } from "@renderer/services/commands";
import type { RdpTarget } from "@shared/types/rdp";

export const rdpService = {
  async fetchTargets(): Promise<RdpTarget[]> {
    return await commands.getRdpTargets();
  },

  async startSession(id: string): Promise<void> {
    await commands.startRdpSession(id);
  },
};
