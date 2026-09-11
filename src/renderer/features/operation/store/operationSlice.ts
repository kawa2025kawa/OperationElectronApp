// src/renderer/features/operation/store/operationSlice.ts

import type { StateCreator } from "zustand";
import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import {
  JOB_STATUS,
  type JobResult,
  type OperationItem,
} from "@shared/types/operation";
import type { StatusSummary } from "@shared/types/ui";
import { showToast } from "@renderer/utils/toastUtils";
import { suppressNextSuccessToast } from "@shared/utils/statusToastSuppression";
import { checkJobDependencies } from "@shared/utils/dependencyHelper";

import {
  buildInitialOperationData,
  evaluateDependenciesCascade,
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
  type ScriptFilePath,
} from "@renderer/features/operation/services/operationServices";

import { selectActiveSelectedItem } from "./operationSelectors";

export interface OperationSlice {
  operationIds: string[];
  operationEntities: Record<string, OperationItem>;
  irregularIds: string[];
  irregularEntities: Record<string, OperationItem>;
  todayIds: string[];
  summary: StatusSummary;

  getEntityByKanriNo: (kanriNo: string | number) => OperationItem | undefined;
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
  }) => Promise<void>;
  resetAllOperationStatuses: () => Promise<void>;
  recalculateSummary: () => void;
  getFilteredSummaryItems: (label: string) => OperationItem[];
  runScriptJob: (
    kanriNo: string,
    filePath?: ScriptFilePath,
  ) => Promise<JobResult>;
  runJcJob: (kanriNo: string) => Promise<void>;

  // 🎯 統合: 選択中ジョブの完了アクション
  completeSelectedOperation: () => Promise<void>;
}

export const createOperationSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationSlice
> = (set, get) => {
  const getOperationItem = (
    kanriNo: string | number,
  ): OperationItem | undefined => {
    return findEntityByKanriNo(get(), kanriNo);
  };

  const updateItemAndRefreshSummary = (update: OperationItem): boolean => {
    let updated = false;
    set((state: AppState) => {
      const result = updateEntityInState(state, update);
      if (!result.updated) return;
      evaluateDependenciesCascade(state);
      updated = true;
      refreshSummary(state);
    });
    return updated;
  };

  const updateCurrentItemStatus = (
    kanriNo: string,
    status: OperationItem["status"],
    comment?: string,
  ): void => {
    const currentItem = getOperationItem(kanriNo);
    if (!currentItem) return;

    updateItemAndRefreshSummary({
      ...currentItem,
      status,
      comment: comment ?? currentItem.comment ?? "",
    });
  };

  return {
    operationIds: [],
    operationEntities: {},
    irregularIds: [],
    irregularEntities: {},
    todayIds: [],
    summary: INITIAL_SUMMARY,

    getEntityByKanriNo: (kanriNo) => getOperationItem(kanriNo),

    setInitialRawData: (operations, irregulars, statuses): void => {
      set((state: AppState) => {
        const initialData = buildInitialOperationData(
          operations,
          irregulars,
          statuses,
        );
        Object.assign(state, initialData);
        evaluateDependenciesCascade(state);
        refreshSummary(state);
      });
    },

    updateItemStatus: (update): void => {
      updateItemAndRefreshSummary(update);
    },

    updateJobStatus: async ({ kanriNo, status, comment }): Promise<void> => {
      if (!status) return;
      updateCurrentItemStatus(kanriNo, status, comment);
      try {
        await commands.updateJobStatus(kanriNo, status, comment);
      } catch (error) {
        console.error(
          `[OperationSlice] Failed to update job status: ${kanriNo}`,
          error,
        );
      }
    },

    resetAllOperationStatuses: async (): Promise<void> => {
      await commands.deleteAllJobStatuses();
      set((state: AppState) => {
        resetAllEntityStatuses(state);
        refreshSummary(state);
      });
    },

    recalculateSummary: (): void => {
      set((state: AppState) => {
        refreshSummary(state);
      });
    },

    getFilteredSummaryItems: (label): OperationItem[] => {
      return filterSummaryItems(get(), label);
    },

    runScriptJob: (kanriNo, filePath): Promise<JobResult> => {
      return executeScriptJob(get(), kanriNo, filePath);
    },

    runJcJob: (kanriNo): Promise<void> => {
      return executeJcJob(get(), kanriNo);
    },

    // 🎯 完了処理の一本化
    completeSelectedOperation: async (): Promise<void> => {
      const state = get();
      const selectedItem = selectActiveSelectedItem(state);
      if (!selectedItem) return;

      const activeFlags = {
        is1CActive: state.is1CActive,
        is2CActive: state.is2CActive,
        is3CActive: state.is3CActive,
      };

      const dependencyResult = checkJobDependencies(
        selectedItem.kanriNo,
        { ...state.operationEntities, ...state.irregularEntities },
        activeFlags,
      );

      if (!dependencyResult.ok) {
        showToast("前提ジョブが未完了です", "error");
        return;
      }

      suppressNextSuccessToast(selectedItem.kanriNo);
      await state.updateJobStatus({
        kanriNo: selectedItem.kanriNo,
        status: JOB_STATUS.SUCCESS,
        comment: "正常完了",
      });
    },
  };
};
