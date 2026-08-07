// src/shared/store/slices/pollingSlice.ts
import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store/index";
import { pollingService } from "./services/pollingService";

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
      await pollingService.startPolling();
      set((s: AppState) => {
        s.isPolling = true;
        s.lastPollTime = new Date().toISOString();
      });
    } catch (error: unknown) {
      set((s: AppState) => {
        s.isPolling = false;
      });
      throw error;
    }
  },

  stopPolling: async () => {
    if (!get().isPolling) return console.warn("[Polling] Polling is not running");
    await pollingService.stopPolling();
    set((s: AppState) => {
      s.isPolling = false;
    });
  },
});
