// src/renderer/features/operation/store/pollingSlice.ts

import type { StateCreator } from "zustand";

import { trpc } from "@renderer/lib/trpc";
import type { AppState } from "@renderer/store";

export interface PollingSlice {
  isPolling: boolean;
  lastPollTime: number | null;

  updateLastPollTime: () => void;
  startPolling: () => Promise<void>;
  stopPolling: () => Promise<void>;
}

export const createPollingSlice: StateCreator<
  AppState,
  [],
  [],
  PollingSlice
> = (set, get) => ({
  isPolling: false,
  lastPollTime: null,

  updateLastPollTime: () => {
    set({ lastPollTime: Date.now() });
  },

  startPolling: async () => {
    if (get().isPolling) {
      return;
    }

    try {
      await trpc.operation.startPolling.mutate();
      set({ isPolling: true });
    } catch (error: unknown) {
      console.error("[PollingSlice] startPolling failed:", error);
    }
  },

  stopPolling: async () => {
    if (!get().isPolling) {
      return;
    }

    try {
      await trpc.operation.stopPolling.mutate();
      set({ isPolling: false });
    } catch (error: unknown) {
      console.error("[PollingSlice] stopPolling failed:", error);
    }
  },
});
