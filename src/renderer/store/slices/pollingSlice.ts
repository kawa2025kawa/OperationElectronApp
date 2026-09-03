// src/renderer/store/slices/pollingSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store/index";

const POLLING_INTERVAL_SEC = 60;

// Zustand の state 外でタイマー ID を管理 (Redux DevTools 等のシリアライズ警告を避けるため)
let uiTimer: ReturnType<typeof setInterval> | null = null;

export interface PollingSlice {
  isPolling: boolean;
  lastPollTime: number | null; // UI計算用に Date オブジェクトや文字列ではなく UNIX タイムスタンプ(ms) を推奨
  timeLeft: number; // UI表示用の残り秒数

  setIsPolling: (status: boolean) => void;
  updateLastPollTime: () => void;
  startPolling: () => Promise<void>;
  stopPolling: () => Promise<void>;
}

export const createPollingSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  PollingSlice
> = (set, get) => {
  // UIのカウントダウンを回す内部関数
  const startUiTimer = () => {
    if (uiTimer) clearInterval(uiTimer);
    uiTimer = setInterval(() => {
      set((state: AppState) => {
        if (!state.isPolling) return;
        // 0 秒でストップさせる（メインプロセス側からの updateLastPollTime 呼び出しで 60 にリセットされるのを待つ）
        state.timeLeft = state.timeLeft > 0 ? state.timeLeft - 1 : 0;
      });
    }, 1000);
  };

  const stopUiTimer = () => {
    if (uiTimer) {
      clearInterval(uiTimer);
      uiTimer = null;
    }
  };

  return {
    isPolling: false,
    lastPollTime: null,
    timeLeft: POLLING_INTERVAL_SEC,

    setIsPolling: (status: boolean) =>
      set((state: AppState) => {
        state.isPolling = status;
        if (!status) {
          stopUiTimer();
          state.timeLeft = POLLING_INTERVAL_SEC;
        }
      }),

    // 【重要】バックエンドからポーリング完了（または開始）のイベントが来た時に呼ばれる
    updateLastPollTime: () =>
      set((state: AppState) => {
        state.lastPollTime = Date.now();
        state.timeLeft = POLLING_INTERVAL_SEC; // ここでズレが強制補正(リセット)される
      }),

    startPolling: async () => {
      if (get().isPolling) {
        console.warn("[Polling] Already polling");
        return;
      }

      try {
        await commands.startPolling(); // メインプロセスのタイマー起動
        toast.success("ポーリングを開始しました");

        set((state: AppState) => {
          state.isPolling = true;
          state.lastPollTime = Date.now();
          state.timeLeft = POLLING_INTERVAL_SEC;
        });

        startUiTimer(); // UI用カウントダウン起動
      } catch (error: unknown) {
        console.error("[startPolling] Failed:", error);

        set((state: AppState) => {
          state.isPolling = false;
        });

        throw error;
      }
    },

    stopPolling: async () => {
      if (!get().isPolling) {
        console.warn("[Polling] Polling is not running");
        return;
      }

      try {
        await commands.stopPolling();
        toast.success("ポーリングを停止しました");
      } catch (error: unknown) {
        console.error("[stopPolling] Failed:", error);
      } finally {
        stopUiTimer();
        set((state: AppState) => {
          state.isPolling = false;
          state.timeLeft = POLLING_INTERVAL_SEC;
        });
      }
    },
  };
};
