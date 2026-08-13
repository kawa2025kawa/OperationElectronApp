import { toast } from "sonner";

import { commands } from "@shared/api/commands";
import type { RdpTarget } from "@shared/types/rdpTypes";

export const rdpService = {
  async fetchTargets(): Promise<RdpTarget[]> {
    return commands.getRdpTargets();
  },

  async startSession(id: string, name: string): Promise<void> {
    toast.info(`${name} へのリモートデスクトップ接続を開始します...`);

    await commands.startRdpSession(id);
  },
};
