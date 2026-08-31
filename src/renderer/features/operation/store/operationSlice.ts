// src/renderer/features/operation/store/operationSlice.ts

import type { StateCreator } from "zustand";

import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import type { OperationItem } from "@shared/types/operationType";
import type { StatusSummary } from "@shared/types/uiType";

import {
  buildInitialOperationData,
  findEntityByKanriNo,
  INITIAL_SUMMARY,
  resetAllEntityStatuses,
  updateEntityInState,
} from "@renderer/features/operation/helpers/operationEntities";

import {
  executeJcJob,
  executeScriptJob,
  filterSummaryItems,
  refreshSummary,
} from "@renderer/features/operation/services/operationServices";

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
      const { updated } = updateEntityInState(state, update);

      if (!updated) return;

      refreshSummary(state);
    }),

  updateJobStatus: async ({ kanriNo, status, comment }) => {
    if (!status) return;

    const currentItem = findEntityByKanriNo(get(), kanriNo);
    if (currentItem) {
      get().updateItemStatus({
        ...currentItem,
        status,
        comment: comment ?? currentItem.comment ?? "",
      });
    }

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

  runScriptJob: (kanriNo, filePath) =>
    executeScriptJob(get(), kanriNo, filePath),

  runJcJob: (kanriNo) => executeJcJob(get(), kanriNo),

  getFilteredSummaryItems: (label) => filterSummaryItems(get(), label),
});
