// src/renderer/store/slices/pollingSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { operationService } from "@renderer/features/operation/operationService";

export interface PollingSlice {
  isPolling: boolean;
  lastPollTime: number | null;
  updateLastPollTime: () => void;
  startPolling: () => Promise<void>;
  stopPolling: () => Promise<void>;
}

// 運用ジョブのポーリング実行状態および最終実行時刻を管理するスライスを生成する。
export const createPollingSlice: StateCreator<
  AppState,
  [],
  [],
  PollingSlice
> = (set, get) => ({
  isPolling: false,
  lastPollTime: null,

  // 最終ポーリング実行時刻を現在時刻に更新する。
  updateLastPollTime: () => {
    set({ lastPollTime: Date.now() });
  },

  // バックエンドへポーリング開始を要求しステートを更新する。
  startPolling: async () => {
    if (get().isPolling) {
      return;
    }

    try {
      await operationService.startPolling();
      set({ isPolling: true });
    } catch (error: unknown) {
      console.error("[PollingSlice] startPolling failed:", error);
    }
  },

  // バックエンドへポーリング停止を要求しステートを更新する。
  stopPolling: async () => {
    if (!get().isPolling) {
      return;
    }

    try {
      await operationService.stopPolling();
      set({ isPolling: false });
    } catch (error: unknown) {
      console.error("[PollingSlice] stopPolling failed:", error);
    }
  },
});
