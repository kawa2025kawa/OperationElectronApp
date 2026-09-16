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
import { refreshSummary } from "@renderer/features/operation/services/operationSummaryService";

import {
  buildInitialOperationData,
  calculateSummary,
  findEntityByKanriNo,
  INITIAL_SUMMARY,
  mergeStatus,
} from "@renderer/features/operation/helpers/operationEntities";

import { filterSummaryItems } from "@renderer/features/operation/services/operationSummaryService";
import { executeJcJob } from "@renderer/features/operation/services/jcJobService";
import {
  executeScriptJob,
  type ScriptFilePath,
} from "@renderer/features/operation/services/scriptJobService";

import { getActiveFlagsFromState } from "@renderer/features/operation/store/centerSlice";
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
  completeSelectedOperation: () => Promise<void>;
}

function refreshSummaryInternal(state: AppState): void {
  const allItems = [
    ...Object.values(state.operationEntities),
    ...Object.values(state.irregularEntities),
  ];
  state.summary = calculateSummary(allItems, getActiveFlagsFromState(state));
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
        refreshSummaryInternal(state);
      });
    },

    /**
     * 🎯【差分更新 (Incremental Update)】
     * Main プロセスから受け取った更新データに基づき、旧ステータス(-1)と新ステータス(+1)の差分のみで高速計算
     */
    updateItemStatus: (update): void => {
      set((state: AppState) => {
        const kanriNo = String(update.kanriNo).trim();
        const entity =
          state.operationEntities[kanriNo] ?? state.irregularEntities[kanriNo];

        if (!entity) return;

        const prevStatus = entity.status;
        mergeStatus(entity, update);

        // ステータス値に変化がない場合（コメント更新等）はサマリー更新をスキップ
        if (prevStatus === update.status) return;

        // 🎯 常に正しい判定基準（todayIrregulars を含めた全対象）で集計を同期
        refreshSummary(state);
      });
    },

    recalculateSummary: (): void => {
      set((state: AppState) => {
        refreshSummary(state);
      });
    },

    updateJobStatus: async ({ kanriNo, status, comment }): Promise<void> => {
      if (!status) return;
      const item = getOperationItem(kanriNo);
      if (item) {
        get().updateItemStatus({
          ...item,
          status,
          comment: comment ?? item.comment ?? "",
        });
      }
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
        const resetEntity = (item: OperationItem) => {
          item.status = JOB_STATUS.SCHEDULED;
          item.comment = null;
          item.startTime = null;
          item.endTime = null;
          item.substatus = null;
          item.info = null;
        };
        Object.values(state.operationEntities).forEach(resetEntity);
        Object.values(state.irregularEntities).forEach(resetEntity);
        refreshSummaryInternal(state);
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

    completeSelectedOperation: async (): Promise<void> => {
      const state = get();
      const selectedItem = selectActiveSelectedItem(state);
      if (!selectedItem) return;

      const activeFlags = getActiveFlagsFromState(state);

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
