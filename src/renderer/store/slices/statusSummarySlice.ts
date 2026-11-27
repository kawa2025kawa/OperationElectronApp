// src/renderer/store/slices/statusSummarySlice.ts

import type { StateCreator } from "zustand";
import { operationService } from "@renderer/features/operation/service/operationService";
import { VIEW_MODES, type ViewMode } from "@renderer/registry/appRegistry";
import type { AppState } from "@renderer/store";
import {
  EMPTY_STATUS_SUMMARY,
  type JobStatus,
  type StatusSummary,
} from "@shared/types/operation/operationTypes";

export interface StatusSummarySlice {
  summary: StatusSummary;
  summaryStatusFilter: JobStatus | null;
  summaryReturnMode: ViewMode | null;
  fetchStatusSummary: () => Promise<void>;
  setSummaryStatusFilter: (status: JobStatus | null) => void;
  toggleSummaryStatusFilter: (status: JobStatus) => void;
  resetStatusSummaryState: () => void;
}

export const createStatusSummarySlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  StatusSummarySlice
> = (set) => {
  let requestId = 0;

  const clearFilterAndRestoreMode = (state: AppState): void => {
    state.summaryStatusFilter = null;
    if (state.summaryReturnMode) {
      state.currentMode = state.summaryReturnMode;
      state.summaryReturnMode = null;
    }
  };

  const applyFilterStatus = (state: AppState, status: JobStatus): void => {
    if (state.currentMode === VIEW_MODES.IRREGULAR) {
      state.summaryStatusFilter = status;
      state.summaryReturnMode = state.summaryReturnMode ?? VIEW_MODES.IRREGULAR;
      state.currentMode = VIEW_MODES.OPERATION;
      return;
    }

    state.summaryStatusFilter = status;
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

        set((state) => {
          state.summary = summary;
        });
      } catch (error) {
        if (currentRequestId === requestId) {
          console.error(
            "[StatusSummaryStore] fetchStatusSummary Error:",
            error,
          );
        }
      }
    },

    setSummaryStatusFilter: (status) => {
      set((state) => {
        if (status === null) {
          clearFilterAndRestoreMode(state);
        } else {
          applyFilterStatus(state, status);
        }
      });
    },

    toggleSummaryStatusFilter: (status) => {
      set((state) => {
        if (state.summaryStatusFilter === status) {
          clearFilterAndRestoreMode(state);
        } else {
          applyFilterStatus(state, status);
        }
      });
    },

    resetStatusSummaryState: () => {
      requestId += 1;
      set((state) => {
        state.summary = { ...EMPTY_STATUS_SUMMARY };
        state.summaryStatusFilter = null;
        state.summaryReturnMode = null;
      });
    },
  };
};