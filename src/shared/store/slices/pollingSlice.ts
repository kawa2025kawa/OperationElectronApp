import { toast } from "sonner";
import type { StateCreator } from "zustand";
import { commands } from "@shared/api/commands";
import type { AppState } from "@shared/store/index";

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
    set((s: AppState) => {
      s.isPolling = status;
    }),

  updateLastPollTime: () =>
    set((s: AppState) => {
      s.lastPollTime = new Date().toISOString();
    }),

  startPolling: async () => {
    if (get().isPolling) return console.warn("[Polling] Already polling");
    try {
      await commands.startPolling();
      toast.success("ポーリングを開始しました");
      set((s: AppState) => {
        s.isPolling = true;
        s.lastPollTime = new Date().toISOString();
      });
    } catch (error: unknown) {
      console.error("[startPolling] Failed:", error);
      set((s: AppState) => {
        s.isPolling = false;
      });
      throw error;
    }
  },

  stopPolling: async () => {
    if (!get().isPolling)
      return console.warn("[Polling] Polling is not running");
    try {
      await commands.stopPolling();
      toast.success("ポーリングを停止しました");
    } catch (error: unknown) {
      console.error("[stopPolling] Failed:", error);
    } finally {
      set((s: AppState) => {
        s.isPolling = false;
      });
    }
  },
});
