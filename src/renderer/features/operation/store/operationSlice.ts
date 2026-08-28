// src/renderer/features/operation/store/operationSlice.ts

import type { StateCreator } from "zustand";

import { commands } from "@shared/service/commands";
import type { AppState } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";
import type { StatusSummary } from "@shared/types/uiType";

import {
  buildInitialOperationData,
  INITIAL_SUMMARY,
  resetAllEntityStatuses,
  updateEntityInState,
} from "@renderer/features/operation/helpers/operationEntities";
import { refreshDependentStatuses } from "@renderer/features/operation/helpers/statusEvaluator";

import {
  executeJcJob,
  executeScriptJob,
  filterSummaryItems,
  refreshSummary,
} from "@renderer/features/operation/services/operationServices";

// ============================================================
// Types
// ============================================================

export interface OperationSlice {
  operationIds: string[];
  operationEntities: Record<string, OperationItem>;
  irregularIds: string[];
  irregularEntities: Record<string, OperationItem>;
  todayIds: string[];
  summary: StatusSummary;

  setInitialRawData: (
    operations: OperationItem[],
    irregulars: OperationItem[],
    statuses: Record<string, OperationItem>,
  ) => void;
  updateItemStatus: (update: OperationItem) => void;
  updateJobStatus: (params: {
    kanriNo: string;
    status: OperationItem["status"];
    comment?: string;
    notify?: boolean;
  }) => Promise<void>;
  recalculateSummary: () => void;
  resetAllOperationStatuses: () => Promise<void>;
  runScriptJob: (
    kanriNo: string,
    filePath?: string | string[],
  ) => Promise<string>;
  runJcJob: (kanriNo: string) => Promise<void>;
  getFilteredSummaryItems: (label: string) => OperationItem[];
}

// ============================================================
// Slice Definition
// ============================================================

export const createOperationSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationSlice
> = (set, get) => ({
  operationIds: [],
  operationEntities: {},
  irregularIds: [],
  irregularEntities: {},
  todayIds: [],
  summary: INITIAL_SUMMARY,

  setInitialRawData: (operations, irregulars, statuses) =>
    set((state: AppState) => {
      const initialData = buildInitialOperationData(
        operations,
        irregulars,
        statuses,
      );

      Object.assign(state, initialData);
      refreshSummary(state);
    }),

  updateItemStatus: (update) =>
    set((state: AppState) => {
      const { updated, statusChanged } = updateEntityInState(state, update);

      if (!updated) return;

      if (statusChanged) {
        refreshDependentStatuses(state, String(update.kanriNo));
      }

      refreshSummary(state);
    }),

  updateJobStatus: async ({ kanriNo, status, comment }) => {
    if (!status) return;

    get().updateItemStatus({
      kanriNo,
      status,
      comment: comment ?? "",
    } as OperationItem);

    try {
      await commands.updateJobStatus(kanriNo, status, comment);
    } catch (error) {
      console.error(
        `[updateJobStatus] Failed to update status for ${kanriNo}:`,
        error,
      );
    }
  },

  recalculateSummary: () =>
    set((state: AppState) => {
      refreshSummary(state);
    }),

  resetAllOperationStatuses: async () => {
    await commands.deleteAllJobStatuses();

    set((state: AppState) => {
      resetAllEntityStatuses(state);
      refreshSummary(state);
    });
  },

  // ------------------------------------------------------------
  // Delegated Services (Script / JC / Summary)
  // ------------------------------------------------------------

  runScriptJob: async (kanriNo, filePath) => {
    return await executeScriptJob(get(), kanriNo, filePath);
  },

  runJcJob: async (kanriNo) => {
    await executeJcJob(get(), kanriNo);
  },

  getFilteredSummaryItems: (label) => {
    return filterSummaryItems(get(), label);
  },
});
