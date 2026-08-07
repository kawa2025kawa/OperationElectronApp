import { toast } from "sonner";
import { commands } from "@shared/api/commands";
import type { RdpTarget } from "@shared/types/rdpTypes";
import { unwrapResult } from "@shared/utils/apiUtils";

export const rdpService = {
  async fetchTargets(): Promise<RdpTarget[]> {
    const res = await commands.getRdpTargets();
    return unwrapResult(res);
  },
  async startSession(id: string, name: string): Promise<void> {
    toast.info(`${name} へのリモートデスクトップ接続を開始します...`);
    const res = await commands.startRdpSession(id);
    unwrapResult(res);
  },
};
