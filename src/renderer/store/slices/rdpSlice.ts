// src/renderer/store/slices/rdpSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type { RdpMaster } from "@shared/types/rdp/rdpTypes";
import { rdpIpcService } from "@renderer/services/rdpIpcService";

export interface RdpSlice {
  rdpTargets: RdpMaster[];
  isRdpLoading: boolean;
  fetchRdpTargets: () => Promise<void>;
  runRdp: (name: string) => Promise<void>;
}

// エラーオブジェクトから適切なエラーメッセージ文字列を抽出する。
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// RDP（リモートデスクトップ）接続先一覧の取得・起動を管理するスライスを生成する。
export const createRdpSlice: StateCreator<AppState, [], [], RdpSlice> = (
  set,
  get,
) => ({
  rdpTargets: [],
  isRdpLoading: false,

  // Google DriveからRDP接続先マスタ一覧を取得してステートに保持する。
  fetchRdpTargets: async () => {
    get().setGlobalProcessing({
      message: "RDP 接続先を取得中...",
      target: "RDP Master",
    });

    set({ isRdpLoading: true });

    try {
      const targets = await rdpIpcService.getMasters();
      set({ rdpTargets: targets });
    } catch (error: unknown) {
      toast.error(`RDP取得エラー: ${getErrorMessage(error)}`);
    } finally {
      set({ isRdpLoading: false });
      get().setGlobalProcessing(null);
    }
  },

  // 指定名称の端末へRDPセッション起動を要求する。
  runRdp: async (name: string) => {
    try {
      await rdpIpcService.startSession(name);
    } catch (error: unknown) {
      toast.error(`RDP起動エラー: ${getErrorMessage(error)}`);
    }
  },
});
