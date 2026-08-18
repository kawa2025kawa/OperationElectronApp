import type { StateCreator } from "zustand";
import { commands } from "@shared/api/commands";
import type { AppState } from "@shared/store";
import type { StatusSummary } from "@shared/types/uiType";
import { buildInitialOperationData } from "@renderer/features/operation/helpers/operationDataFactory";
import {
  findEntityByKanriNo,
  getAllEntities as getAllEntitiesMap,
  resetAllEntityStatuses,
  updateEntityInState,
} from "@renderer/features/operation/helpers/operationEntities";
import {
  calculateSummary,
  getAllEntities as getAllEntitiesArray,
  INITIAL_SUMMARY,
} from "@renderer/features/operation/helpers/operationSummary";
import {
  calculateNextStatus,
  refreshDependentStatuses,
} from "@renderer/features/operation/helpers/statusEvaluator";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/jobRunnerHelper";
import { jcService } from "@renderer/features/operation/services/jcService";
import { scriptService } from "@renderer/features/operation/services/scriptService";
import type { JobStatus, OperationItem } from "@shared/types/operationType";

export interface OperationSlice {
  operationIds: string[];
  operationEntities: Record<string, OperationItem>;
  irregularIds: string[];
  irregularEntities: Record<string, OperationItem>;
  todayIds: string[];
  summary: StatusSummary;

  // ポーリング関連
  isPolling: boolean;
  startPolling: () => Promise<void>;
  stopPolling: () => Promise<void>;

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
  recalculateSummary: () => void;
  resetAllOperationStatuses: () => Promise<void>;
  runScriptJob: (kanriNo: string) => Promise<void>;
  runJcJob: (kanriNo: string) => Promise<void>;

  // サマリーモーダル用の一覧データ取得
  getFilteredSummaryItems: (label: string) => OperationItem[];
}

/** activeFlags を反映して正確なサマリーを計算 */
function refreshSummary(state: AppState): void {
  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };
  state.summary = calculateSummary(getAllEntitiesArray(state), activeFlags);
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

  isPolling: false,

  startPolling: async () => {
    await commands.startPolling();
    set((state: AppState) => {
      state.isPolling = true;
    });
  },

  stopPolling: async () => {
    await commands.stopPolling();
    set((state: AppState) => {
      state.isPolling = false;
    });
  },

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
    await commands.updateJobStatus(kanriNo, status, comment);
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

  runScriptJob: async (kanriNo) => {
    const state = get();
    const target = findEntityByKanriNo(state, kanriNo);
    await runJobWithGlobalProcessing(
      state,
      "スクリプト実行中...",
      target?.workName ?? null,
      () =>
        scriptService.executeScript(
          kanriNo,
          getAllEntitiesMap(state),
          state.updateItemStatus,
        ),
    );
  },

  runJcJob: async (kanriNo) => {
    const state = get();
    const target = findEntityByKanriNo(state, kanriNo);
    const jobId = (target && "jobId" in target ? target.jobId : null) ?? null;
    await runJobWithGlobalProcessing(state, "JC照会中...", jobId, () =>
      jcService.executeJcJob(
        kanriNo,
        getAllEntitiesMap(state),
        state.updateItemStatus,
      ),
    );
  },

  // フィルタリング処理を Store 側に集約
  getFilteredSummaryItems: (label: string): OperationItem[] => {
    const state = get();
    const lowerLabel = label.toLowerCase();
    if (lowerLabel === "progress") return [];

    const targetItems: OperationItem[] = getAllEntitiesArray(state);
    if (lowerLabel === "total") return targetItems;

    const activeFlags = {
      is1CActive: Boolean(state.is1CActive),
      is2CActive: Boolean(state.is2CActive),
      is3CActive: Boolean(state.is3CActive),
    };

    const allEntitiesMap = getAllEntitiesMap(state);

    return targetItems.filter((item: OperationItem) => {
      const currentStatus = (
        item.status ? String(item.status).toLowerCase() : ""
      ) as JobStatus;
      const computedStatus = calculateNextStatus(
        item,
        currentStatus,
        allEntitiesMap,
        activeFlags,
      );
      return computedStatus === lowerLabel;
    });
  },
});
