// src/renderer/store/slices/statusSummarySlice.ts

import type { StateCreator } from "zustand";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { ViewMode } from "@renderer/registry/appRegistry";
import type { AppState } from "@renderer/store";
import type { JobStatus } from "@shared/types/operation/operationTypes";
import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
} from "@shared/types/operation/operationTypes";

export interface StatusSummarySlice {
  summary: StatusSummary;
  summaryStatusFilter: JobStatus | null;
  summaryReturnMode: ViewMode | null;
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
> = (set, get) => {
  let requestId = 0;

  const clearFilterAndRestoreMode = (): void => {
    const { summaryReturnMode } = get();
    set({
      summaryStatusFilter: null,
      summaryReturnMode: null,
      ...(summaryReturnMode ? { currentMode: summaryReturnMode } : {}),
    });
  };

  const applyFilterStatus = (status: JobStatus): void => {
    const { currentMode, summaryReturnMode } = get();
    if (currentMode === "irregular") {
      set({
        summaryStatusFilter: status,
        summaryReturnMode: summaryReturnMode ?? "irregular",
        currentMode: "operation",
      });
      return;
    }

    set({ summaryStatusFilter: status });
  };

  return {
    summary: { ...EMPTY_STATUS_SUMMARY },
    summaryStatusFilter: null,
    summaryReturnMode: null,

    fetchStatusSummary: async () => {
      const currentRequestId = ++requestId;

      try {
        const summary = await operationService.getStatusSummary();
        if (currentRequestId !== requestId) return;
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
      requestId += 1;
      set({ summary });
    },

    setSummaryStatusFilter: (status) => {
      if (status === null) {
        clearFilterAndRestoreMode();
        return;
      }
      applyFilterStatus(status);
    },

    toggleSummaryStatusFilter: (status) => {
      if (get().summaryStatusFilter === status) {
        clearFilterAndRestoreMode();
        return;
      }
      applyFilterStatus(status);
    },
  };
};
