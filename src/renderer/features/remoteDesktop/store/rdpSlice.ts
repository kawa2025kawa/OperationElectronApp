// src/renderer/features/remoteDesktop/store/rdpSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { rdpService } from "@renderer/features/remoteDesktop/services/rdpService";
import type { RdpMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

export interface RdpSlice {
  rdpTargets: RdpMaster[];
  isRdpLoading: boolean;
  fetchRdpTargets: () => Promise<void>;
  runRdp: (name: string) => Promise<void>;
}

export const createRdpSlice: StateCreator<AppState, [], [], RdpSlice> = (
  set,
  get,
) => ({
  rdpTargets: [],
  isRdpLoading: false,

  fetchRdpTargets: async () => {
    get().setGlobalProcessing({
      message: "RDP 接続先を取得中...",
      target: "RDP Master",
    });

    set({ isRdpLoading: true });

    try {
      const targets = await rdpService.fetchTargets();

      set({ rdpTargets: targets });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      toast.error(`RDP取得エラー: ${message}`);
    } finally {
      set({ isRdpLoading: false });
      get().setGlobalProcessing(null);
    }
  },

  runRdp: async (name: string) => {
    const exists = get().rdpTargets.some((item) => item.name === name);

    if (!exists) {
      toast.error(`RDPターゲットが見つかりません: ${name}`);
      return;
    }

    try {
      await rdpService.startSession(name);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      toast.error(`RDP起動エラー: ${message}`);
    }
  },
});
