// src/shared/store/slices/rdpSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store/index";
import type { RdpTarget } from "@shared/types/rdpTypes";
import { rdpService } from "./services/rdpService";

export interface RdpSlice {
  rdpTargets: RdpTarget[];
  isRdpLoading: boolean;
  setRdpTargets: (targets: RdpTarget[]) => void;
  fetchRdpTargets: () => Promise<void>;
  runRdp: (id: string) => Promise<void>;
}

export const createRdpSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  RdpSlice
> = (set, get) => ({
  rdpTargets: [],
  isRdpLoading: false,
  setRdpTargets: (targets: RdpTarget[]) =>
    set((s: AppState) => {
      s.rdpTargets = targets;
    }),
  fetchRdpTargets: async () => {
    set((s: AppState) => {
      s.isRdpLoading = true;
    });
    try {
      const targets = await rdpService.fetchTargets();
      set((s: AppState) => {
        s.rdpTargets = targets;
      });
    } catch (error: unknown) {
      toast.error(
        `RDP取得エラー: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      set((s: AppState) => {
        s.isRdpLoading = false;
      });
    }
  },
  runRdp: async (id: string) => {
    const target = get().rdpTargets.find((t: RdpTarget) => t.id === id);
    if (!target) {
      toast.error("対象のRDP接続先が見つかりません");
      return;
    }
    try {
      await rdpService.startSession(target.id, target.name);
    } catch (error: unknown) {
      toast.error(
        `RDP接続エラー: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
