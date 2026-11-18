// src/renderer/store/slices/statusSummarySlice.ts

import type { StateCreator } from "zustand";

import { operationService } from "@renderer/features/operation/service/operationService";
import type { AppState } from "@renderer/store";
import type { JobStatus } from "@shared/types/operation/operationTypes";
import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
} from "@shared/types/statusSummary/statusSummaryTypes";

export interface StatusSummarySlice {
  summary: StatusSummary;
  summaryStatusFilter: JobStatus | null;
  fetchStatusSummary: () => Promise<void>;
  setStatusSummary: (summary: StatusSummary) => void;
  setSummaryStatusFilter: (status: JobStatus | null) => void;
  toggleSummaryStatusFilter: (status: JobStatus) => void;
}

export const createStatusSummarySlice: StateCreator<
  AppState,
  [],
  [],
  StatusSummarySlice
> = (set) => {
  let requestId = 0;

  return {
    summary: { ...EMPTY_STATUS_SUMMARY },
    summaryStatusFilter: null,

    fetchStatusSummary: async () => {
      const currentRequestId = ++requestId;

      try {
        const summary = await operationService.getStatusSummary();

        if (currentRequestId !== requestId) {
          return;
        }

        set({ summary });
      } catch (error) {
        if (currentRequestId === requestId) {
          console.error(
            "[StatusSummaryStore] fetchStatusSummary Error:",
            error,
          );
        }
      }
    },

    setStatusSummary: (summary) => {
      // 進行中の取得結果が手動設定を上書きしないよう無効化する。
      requestId += 1;

      set({ summary });
    },

    setSummaryStatusFilter: (status) => {
      set({ summaryStatusFilter: status });
    },

    toggleSummaryStatusFilter: (status) => {
      set((state) => ({
        summaryStatusFilter:
          state.summaryStatusFilter === status ? null : status,
      }));
    },
  };
};
