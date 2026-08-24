// src/renderer/features/operation/store/operationSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { commands } from "@shared/api/commands";
import type { AppState } from "@shared/store";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import { JOB_STATUS } from "@shared/types/operationType";
import type { StatusSummary } from "@shared/types/uiType";

import {
  checkJobDependencies,
  type MissingDependency,
} from "@renderer/features/operation/helpers/dependencyHelper";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/jobRunnerHelper";
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
import {
  createErrorStatus,
  createRunningStatus,
  createSuccessStatus,
} from "@renderer/features/operation/helpers/statusFactory";

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

const STATUS_LABELS: Record<string, string> = {
  scheduled: "予定",
  running: "実行中",
  scriptRunning: "スクリプト実行中",
  ready: "準備完了",
  waiting: "待機中",
  success: "完了",
  error: "エラー",
};

const createDependencyErrorComment = (
  dependencies: MissingDependency[],
): string => {
  if (dependencies.length === 0) return "依存関係を満たしていません";
  const details = dependencies.map(({ kanriNo, status }) => {
    const label = status ? (STATUS_LABELS[status] ?? status) : "未完了";
    return `${kanriNo}: ${label}`;
  });
  return `未完了の依存ジョブ: ${details.join(" ")}`;
};

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

  // ==========================================================
  // Script Job
  // ==========================================================

  runScriptJob: async (kanriNo) => {
    const state = get();
    const allEntities = getAllEntitiesMap(state);
    const item = findEntityByKanriNo(state, kanriNo);

    if (!item) {
      const message = `対象ジョブが見つかりません: ${kanriNo}`;
      toast.error(message);
      throw new Error(message);
    }

    const targetName = item.workName
      ? String(item.workName).trim()
      : String(kanriNo).trim();

    await runJobWithGlobalProcessing(
      state,
      "スクリプト実行中...",
      targetName,
      async () => {
        const dependencyResult = checkJobDependencies(kanriNo, allEntities);
        if (!dependencyResult.ok) {
          const comment = createDependencyErrorComment(
            dependencyResult.missingDependencies,
          );
          state.updateItemStatus({ ...item, comment });
          toast.warning(comment);
          return;
        }

        state.updateItemStatus(
          createRunningStatus(kanriNo, item, "スクリプト実行中..."),
        );

        try {
          const resultMessage = await commands.executeScript(kanriNo);
          state.updateItemStatus(
            createSuccessStatus(
              kanriNo,
              item,
              resultMessage || "スクリプト実行完了",
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          const comment = `スクリプト実行エラー: ${message}`;
          state.updateItemStatus(createErrorStatus(kanriNo, item, comment));
          toast.error(comment);
          throw error;
        }
      },
    );
  },

  // ==========================================================
  // JC Job
  // ==========================================================

  runJcJob: async (kanriNo) => {
    const state = get();
    const allEntities = getAllEntitiesMap(state);
    const item = findEntityByKanriNo(state, kanriNo);

    if (!item) {
      throw new Error(`対象ジョブが見つかりません: ${kanriNo}`);
    }

    const jobId =
      "jobId" in item && item.jobId
        ? String(item.jobId).trim()
        : String(kanriNo).trim();

    await runJobWithGlobalProcessing(state, "JC照会中...", jobId, async () => {
      if (item.dependency && !checkJobDependencies(kanriNo, allEntities).ok) {
        const message = "前提条件が満たされていません";
        state.updateItemStatus(createErrorStatus(kanriNo, item, message));
        toast.error(message);
        return;
      }

      try {
        const result = await commands.fetchSingleJobStatus(kanriNo);
        const status = result.status ?? JOB_STATUS.SCHEDULED;

        state.updateItemStatus({
          ...item,
          status,
          startTime: result.startTime ?? item.startTime,
          endTime: result.endTime ?? item.endTime,
          expectedStartTime: result.expectedStartTime ?? item.expectedStartTime,
          expectedEndTime: result.expectedEndTime ?? item.expectedEndTime,
          comment:
            result.comment ??
            (status === JOB_STATUS.RUNNING ? "JC実行中..." : "JC状態取得完了"),
          substatus: result.substatus ?? item.substatus,
          info: result.info ?? item.info,
        });
        toast.info(`No.${kanriNo} JCステータス更新完了`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errText = `JC実行エラー: ${message}`;
        state.updateItemStatus(createErrorStatus(kanriNo, item, errText));
        toast.error(errText);
        throw error;
      }
    });
  },

  // ==========================================================
  // Filtered Summary Items
  // ==========================================================

  getFilteredSummaryItems: (label): OperationItem[] => {
    const state = get();
    const lowerLabel = label.toLowerCase();
    const targetItems = getAllEntitiesArray(state);

    if (lowerLabel === "total") {
      return targetItems;
    }

    if (lowerLabel === "progress") {
      return targetItems.filter((item: OperationItem) => {
        const status = item.status ? String(item.status).toLowerCase() : "";
        return status === "running" || status === "scriptrunning";
      });
    }

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
