// src/renderer/features/operation/store/operationSlice.ts

import type { StateCreator } from "zustand";

import { commands } from "@shared/api/commands";
import type { AppState } from "@shared/store";
import type { StatusSummary } from "@shared/types/uiType";
import type { JobStatus, OperationItem } from "@shared/types/operationType";

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

  runScriptJob: (kanriNo: string) => Promise<void>;

  runJcJob: (kanriNo: string) => Promise<void>;

  getFilteredSummaryItems: (label: string) => OperationItem[];
}

// ============================================================
// Helpers
// ============================================================

/**
 * activeFlags を現在の Store 状態から取得し、
 * Summary を再計算する。
 */
function refreshSummary(state: AppState): void {
  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };

  state.summary = calculateSummary(getAllEntitiesArray(state), activeFlags);
}

// ============================================================
// Slice
// ============================================================

export const createOperationSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationSlice
> = (set, get) => ({
  // ==========================================================
  // Initial State
  // ==========================================================

  operationIds: [],

  operationEntities: {},

  irregularIds: [],

  irregularEntities: {},

  todayIds: [],

  summary: INITIAL_SUMMARY,

  // ==========================================================
  // Initial Data
  // ==========================================================

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

  // ==========================================================
  // Item Status
  // ==========================================================

  updateItemStatus: (update) =>
    set((state: AppState) => {
      const { updated, statusChanged } = updateEntityInState(state, update);

      if (!updated) {
        return;
      }

      if (statusChanged) {
        refreshDependentStatuses(state, String(update.kanriNo));
      }

      refreshSummary(state);
    }),

  // ==========================================================
  // Job Status
  // ==========================================================

  updateJobStatus: async ({ kanriNo, status, comment }) => {
    if (!status) {
      return;
    }

    // --------------------------------------------------------
    // Update UI immediately
    // --------------------------------------------------------

    get().updateItemStatus({
      kanriNo,
      status,
      comment: comment ?? "",
    } as OperationItem);

    // --------------------------------------------------------
    // Persist to main process
    // --------------------------------------------------------

    try {
      await commands.updateJobStatus(kanriNo, status, comment);
    } catch (error) {
      console.error(
        `[updateJobStatus] Failed to update status for ${kanriNo}:`,
        error,
      );

      // 必要に応じて将来的にRollback処理を追加する。
    }
  },

  // ==========================================================
  // Summary
  // ==========================================================

  recalculateSummary: () =>
    set((state: AppState) => {
      refreshSummary(state);
    }),

  // ==========================================================
  // Reset Status
  // ==========================================================

  resetAllOperationStatuses: async () => {
    await commands.deleteAllJobStatuses();

    set((state: AppState) => {
      resetAllEntityStatuses(state);

      refreshSummary(state);
    });
  },

  // ==========================================================
  // Script Job
  // ==========================================================

  runScriptJob: async (kanriNo) => {
    const state = get();

    const target = findEntityByKanriNo(state, kanriNo);

    /**
     * 通常Scriptは workName を表示対象とする。
     *
     * 対象が見つからない場合でも target を必ず表示するため、
     * KanriNo をfallbackとして使用する。
     */
    const targetName = target?.workName
      ? String(target.workName).trim()
      : String(kanriNo).trim();

    await runJobWithGlobalProcessing(
      state,
      "スクリプト実行中...",
      targetName,
      () =>
        scriptService.executeScript(
          kanriNo,
          getAllEntitiesMap(state),
          state.updateItemStatus,
        ),
    );
  },

  // ==========================================================
  // JC Job
  // ==========================================================

  runJcJob: async (kanriNo) => {
    const state = get();

    const target = findEntityByKanriNo(state, kanriNo);

    /**
     * JCは JobID を対象表示に使用する。
     *
     * JobID が存在しない場合は KanriNo をfallbackとして使用する。
     */
    const jobId =
      target && "jobId" in target && target.jobId
        ? String(target.jobId).trim()
        : String(kanriNo).trim();

    await runJobWithGlobalProcessing(state, "JC照会中...", jobId, () =>
      jcService.executeJcJob(
        kanriNo,
        getAllEntitiesMap(state),
        state.updateItemStatus,
      ),
    );
  },

  // ==========================================================
  // Filtered Summary Items
  // ==========================================================

  getFilteredSummaryItems: (label): OperationItem[] => {
    const state = get();

    const lowerLabel = label.toLowerCase();

    const targetItems = getAllEntitiesArray(state);

    // --------------------------------------------------------
    // Total
    // --------------------------------------------------------

    if (lowerLabel === "total") {
      return targetItems;
    }

    // --------------------------------------------------------
    // Progress
    // --------------------------------------------------------

    if (lowerLabel === "progress") {
      return targetItems.filter((item: OperationItem) => {
        const status = item.status ? String(item.status).toLowerCase() : "";

        return status === "running" || status === "scriptrunning";
      });
    }

    // --------------------------------------------------------
    // Status
    // --------------------------------------------------------

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
