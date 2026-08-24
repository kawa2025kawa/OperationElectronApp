// src/renderer/features/remoteDesktop/store/rdpSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";
import { rdpService } from "@renderer/features/remoteDesktop/services/rdpService";
import type { RdpTarget } from "@shared/types/rdpTypes";

export interface RdpSlice {
  rdpTargets: RdpTarget[];
  isRdpLoading: boolean;
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

  fetchRdpTargets: async () => {
    // 全画面 LOADING 表示を開始
    get().setGlobalProcessing({
      message: "RDP ターゲット情報を読み込み中...",
      target: "リモートデスクトップ",
    });

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
      // 全画面 LOADING 表示を解除
      get().setGlobalProcessing(null);
    }
  },

  runRdp: async (id: string) => {
    const target = get().rdpTargets.find((t: RdpTarget) => t.id === id);
    if (!target) {
      toast.error("対象のRDP接続先が見つかりません");
      return;
    }
    try {
      await rdpService.startSession(target.id);
    } catch (error: unknown) {
      toast.error(
        `RDP接続エラー: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});
