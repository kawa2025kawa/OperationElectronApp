// src/renderer/features/operation/store/statusSummarySlice.ts

import type { StateCreator } from "zustand";

import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AppState } from "@renderer/store";

import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
} from "@shared/types/statusSummary/statusSummaryTypes";

/* =========================
 * Public Slice Interface
 * ========================= */

export interface StatusSummarySlice {
  summary: StatusSummary;

  fetchStatusSummary(): Promise<void>;
  setStatusSummary(summary: StatusSummary): void;
}

/* =========================
 * Slice Creator
 * ========================= */

export const createStatusSummarySlice: StateCreator<
  AppState,
  [],
  [],
  StatusSummarySlice
> = (set) => ({
  summary: {
    ...EMPTY_STATUS_SUMMARY,
  },

  /* =========================
   * Fetch Summary from Backend
   * ========================= */

  fetchStatusSummary: async () => {
    try {
      const summary = await window.electronAPI.invoke(
        IPC_CHANNELS.OPERATION.GET_STATUS_SUMMARY,
      );
      set({ summary });
    } catch (error) {
      console.error("[StatusSummaryStore] fetchStatusSummary Error:", error);
    }
  },

  /* =========================
   * Direct Set Summary
   * ========================= */

  setStatusSummary: (summary) => {
    set({ summary });
  },
});
