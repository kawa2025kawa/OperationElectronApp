import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store/index";

export interface PollingSlice {
  isPolling: boolean;
  lastPollTime: string | null;

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
> = (set, get) => ({
  isPolling: false,
  lastPollTime: null,

  setIsPolling: (status: boolean) =>
    set((state: AppState) => {
      state.isPolling = status;
    }),

  updateLastPollTime: () =>
    set((state: AppState) => {
      state.lastPollTime = new Date().toISOString();
    }),

  startPolling: async () => {
    if (get().isPolling) {
      console.warn("[Polling] Already polling");
      return;
    }

    try {
      await commands.startPolling();
      toast.success("ポーリングを開始しました");

      set((state: AppState) => {
        state.isPolling = true;
        state.lastPollTime = new Date().toISOString();
      });
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
      set((state: AppState) => {
        state.isPolling = false;
      });
    }
  },
});
