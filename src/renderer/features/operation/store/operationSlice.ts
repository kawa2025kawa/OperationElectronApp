// src/renderer/features/operation/store/operationSlice.ts

import type { StateCreator } from "zustand";

import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";

import {
  JOB_STATUS,
  type JobResult,
  type JobStatus,
  type OperationItem,
  type OperationItemStatusUpdate,
  type RawOperationStatusUpdate,
  type StatusSummary,
} from "@shared/types/operation/operationTypes";

import { showToast } from "@renderer/utils/toastUtils";
import { suppressNextSuccessToast } from "@shared/utils/statusToastSuppression";
import { checkJobDependencies } from "@shared/utils/dependency/dependencyUtils";

import {
  filterSummaryItems,
  refreshSummary,
} from "@renderer/features/operation/services/operationSummaryService";

import {
  buildInitialOperationData,
  calculateSummary,
  findEntityByKanriNo,
  getActiveStatusEntitiesMap,
  INITIAL_SUMMARY,
} from "@renderer/features/operation/helpers/operationEntities";

import { executeJcJob } from "@renderer/features/operation/services/jcJobService";

import {
  executeScriptJob,
  type ScriptFilePath,
} from "@renderer/features/operation/services/scriptJobService";

import { getActiveFlagsFromState } from "@renderer/features/operation/store/centerSlice";

import { selectActiveSelectedItem } from "./operationSelectors";

/* ============================================================================
 * Helper
 * ========================================================================== */

const STATUS_ALIAS_MAP: Readonly<Record<string, JobStatus>> = {
  scheduled: JOB_STATUS.SCHEDULED,
  running: JOB_STATUS.RUNNING,
  run: JOB_STATUS.RUNNING,
  processing: JOB_STATUS.RUNNING,
  scriptrunning: JOB_STATUS.SCRIPT_RUNNING,
  success: JOB_STATUS.SUCCESS,
  done: JOB_STATUS.SUCCESS,
  ready: JOB_STATUS.READY,
  waiting: JOB_STATUS.WAITING,
  wait: JOB_STATUS.WAITING,
  error: JOB_STATUS.ERROR,
  failed: JOB_STATUS.ERROR,
  warning: JOB_STATUS.SUCCESS,
};

function parseJobStatus(rawStatus?: string | null): JobStatus | undefined {
  if (!rawStatus) return undefined;

  const normalized = rawStatus.trim().toLowerCase();

  return STATUS_ALIAS_MAP[normalized];
}

/* ============================================================================
 * Slice Type Definition
 * ========================================================================== */

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
    todayIrregulars?: OperationItem[],
  ) => void;

  updateItemStatus: (update: OperationItemStatusUpdate) => void;

  updateOperationStatusFromMain: (payload: RawOperationStatusUpdate) => void;

  updateJobStatus: (params: {
    kanriNo: string;
    status: JobStatus;
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

/* ============================================================================
 * Internal Helpers
 * ========================================================================== */

function refreshSummaryInternal(state: AppState): void {
  const todayIds = new Set(state.todayIds.map((id) => String(id).trim()));

  const operations = Object.values(state.operationEntities);

  const todayIrregulars = Object.values(state.irregularEntities).filter(
    (item) => todayIds.has(String(item.kanriNo).trim()),
  );

  const targetItems = [...operations, ...todayIrregulars];

  state.summary = calculateSummary(targetItems, getActiveFlagsFromState(state));
}

function findTargetEntity(
  state: AppState,
  kanriNo: string,
):
  | {
      entity: OperationItem;
      targetMap: Record<string, OperationItem>;
    }
  | undefined {
  const operationEntity = state.operationEntities[kanriNo];

  if (operationEntity) {
    return {
      entity: operationEntity,
      targetMap: state.operationEntities,
    };
  }

  const isTodayIrregular = state.todayIds.some(
    (id) => String(id).trim() === kanriNo,
  );

  if (!isTodayIrregular) {
    return undefined;
  }

  const irregularEntity = state.irregularEntities[kanriNo];

  if (irregularEntity) {
    return {
      entity: irregularEntity,
      targetMap: state.irregularEntities,
    };
  }

  return undefined;
}

/* ============================================================================
 * Slice Implementation
 * ========================================================================== */

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
    /* ------------------------------------------------------------------------
     * Initial State
     * ---------------------------------------------------------------------- */

    operationIds: [],
    operationEntities: {},

    irregularIds: [],
    irregularEntities: {},

    todayIds: [],

    summary: INITIAL_SUMMARY,

    /* ------------------------------------------------------------------------
     * Selectors
     * ---------------------------------------------------------------------- */

    getEntityByKanriNo: (kanriNo): OperationItem | undefined => {
      return getOperationItem(kanriNo);
    },

    getFilteredSummaryItems: (label): OperationItem[] => {
      return filterSummaryItems(get(), label);
    },

    /* ------------------------------------------------------------------------
     * Initial Data
     * ---------------------------------------------------------------------- */

    setInitialRawData: (
      operations,
      irregulars,
      statuses,
      todayIrregulars,
    ): void => {
      set((state: AppState) => {
        const initialData = buildInitialOperationData(
          operations,
          irregulars,
          statuses,
          todayIrregulars,
        );

        Object.assign(state, initialData);

        refreshSummaryInternal(state);
      });
    },

    /* ------------------------------------------------------------------------
     * Store Internal Status Update
     * ---------------------------------------------------------------------- */

    updateItemStatus: (update): void => {
      set((state: AppState) => {
        const rawKey = update.kanriNo;

        if (rawKey == null) {
          console.warn(
            "[OperationSlice] Status update ignored: kanriNo/no is missing.",
          );
          return;
        }

        const kanriNo = String(rawKey).trim();

        if (!kanriNo) {
          console.warn(
            "[OperationSlice] Status update ignored: kanriNo is empty.",
          );
          return;
        }

        const target = findTargetEntity(state, kanriNo);

        if (!target) {
          console.warn(
            `[OperationSlice] Status update ignored: No.${kanriNo} not found.`,
          );
          return;
        }

        const { entity: currentEntity, targetMap } = target;

        const updatedEntity: OperationItem = {
          ...currentEntity,
          ...update,
          status: update.status ?? currentEntity.status,
          kanriNo: currentEntity.kanriNo,
        };

        targetMap[kanriNo] = updatedEntity;

        refreshSummaryInternal(state);
      });
    },

    /* ------------------------------------------------------------------------
     * Main → Renderer IPC Status Update
     * ---------------------------------------------------------------------- */

    updateOperationStatusFromMain: (payload): void => {
      const {
        kanriNo,
        status,
        comment,
        startTime,
        endTime,
        expectedStartTime,
        expectedEndTime,
        substatus,
        info,
      } = payload;

      const cleanNo = String(kanriNo).trim();

      if (!cleanNo) {
        console.warn(
          "[OperationSlice] IPC status update ignored: kanriNo is empty.",
        );
        return;
      }

      const normalizedStatus =
        typeof status === "string" ? parseJobStatus(status) : status;

      if (!normalizedStatus) {
        console.warn(
          `[OperationSlice] IPC status update ignored: unknown status "${status}" for No.${cleanNo}.`,
        );
        return;
      }

      set((state: AppState) => {
        const target = findTargetEntity(state, cleanNo);

        if (!target) {
          console.warn(
            `[OperationSlice] IPC status update ignored: No.${cleanNo} not found in Store entities.`,
          );
          return;
        }

        const { entity: targetEntity } = target;

        const beforeStatus = targetEntity.status;

        /*
         * Mainから届いた値だけを既存Entityへ上書きする。
         *
         * undefined:
         *   → 既存値を保持
         *
         * null:
         *   → Mainが明示的に空にした値として反映
         */
        targetEntity.status = normalizedStatus;

        if (comment !== undefined) {
          targetEntity.comment = comment;
        }

        if (startTime !== undefined) {
          targetEntity.startTime = startTime;
        }

        if (endTime !== undefined) {
          targetEntity.endTime = endTime;
        }

        if (expectedStartTime !== undefined) {
          targetEntity.expectedStartTime = expectedStartTime;
        }

        if (expectedEndTime !== undefined) {
          targetEntity.expectedEndTime = expectedEndTime;
        }

        if (substatus !== undefined) {
          targetEntity.substatus = substatus;
        }

        if (info !== undefined) {
          targetEntity.info = info;
        }

        console.log(
          `[UI Update] 🔄 Status Changed -> No.${cleanNo}: ${beforeStatus} ➔ ${normalizedStatus}`,
        );

        console.log(
          `[UI Update] ⏱ Time -> No.${cleanNo}: start=${String(
            targetEntity.startTime ?? "",
          )}, end=${String(targetEntity.endTime ?? "")}`,
        );

        refreshSummaryInternal(state);
      });
    },

    /* ------------------------------------------------------------------------
     * Summary
     * ---------------------------------------------------------------------- */

    recalculateSummary: (): void => {
      set((state: AppState) => {
        refreshSummary(state);
      });
    },

    /* ------------------------------------------------------------------------
     * Job Status Update
     * ---------------------------------------------------------------------- */

    updateJobStatus: async ({ kanriNo, status, comment }): Promise<void> => {
      const targetKanriNo = String(kanriNo).trim();

      if (!targetKanriNo) {
        return;
      }

      const item = getOperationItem(targetKanriNo);

      if (!item) {
        return;
      }

      const previousStatus = item.status;
      const previousComment = item.comment;

      get().updateItemStatus({
        kanriNo: targetKanriNo,
        status,
        comment: comment ?? item.comment ?? "",
      });

      try {
        await commands.updateJobStatus(targetKanriNo, status, comment);
      } catch (error) {
        console.error(
          `[OperationSlice] Failed to update job status: ${targetKanriNo}`,
          error,
        );

        get().updateItemStatus({
          kanriNo: targetKanriNo,
          status: previousStatus,
          comment: previousComment ?? "",
        });

        throw error;
      }
    },

    /* ------------------------------------------------------------------------
     * Reset
     * ---------------------------------------------------------------------- */

    resetAllOperationStatuses: async (): Promise<void> => {
      console.log("[DEBUG:Reset] 1. リセット処理を開始します");

      await commands.deleteAllJobStatuses();

      const token = get().accessToken;

      if (!token) {
        throw new Error("Google Token is missing");
      }

      console.log(
        "[DEBUG:Reset] 2. Google Sheets から最新マスターデータを取得中...",
      );

      await Promise.all([
        get().fetchSheetData("OperationMasterList", token, false, true),
        get().fetchSheetData("IrregularMasterList", token, false, true),
        get().fetchSheetData("TodayIrregularMasterList", token, false, true),
      ]);

      const latestStore = get();

      const operations = (latestStore.sheetData["OperationMasterList"]?.data ??
        []) as OperationItem[];

      const irregulars = (latestStore.sheetData["IrregularMasterList"]?.data ??
        []) as OperationItem[];

      const todayIrregulars = (latestStore.sheetData["TodayIrregularMasterList"]
        ?.data ?? []) as OperationItem[];

      console.log(
        "[DEBUG:Reset] 3. Backend へリセット指示を送信中 (RESET_STATUSES)...",
      );

      const result = await commands.resetOperationStatusesFromSpreadsheet({
        operations,
        irregulars,
        todayIrregulars,
      });

      if (!result.success || !result.data) {
        throw new Error("Mainプロセスでのリセットに失敗しました");
      }

      set((state: AppState) => {
        console.log(
          "[DEBUG:Reset] 4. Backendから確定データを受信。Zustandストアへ反映中...",
        );

        const resetStatusMap: Record<string, OperationItem> = {};

        for (const item of result.data) {
          const itemKanriNo = String(item.kanriNo).trim();

          if (itemKanriNo) {
            resetStatusMap[itemKanriNo] = item;
          }
        }

        const initialData = buildInitialOperationData(
          operations,
          irregulars,
          resetStatusMap,
          todayIrregulars,
        );

        state.operationIds = initialData.operationIds;
        state.operationEntities = initialData.operationEntities;
        state.irregularIds = initialData.irregularIds;
        state.irregularEntities = initialData.irregularEntities;
        state.todayIds = initialData.todayIds;

        refreshSummaryInternal(state);

        console.log("[DEBUG:Reset] 5. Zustand ストアの反映が完了しました");
      });
    },

    /* ------------------------------------------------------------------------
     * Job Execution
     * ---------------------------------------------------------------------- */

    runScriptJob: (kanriNo, filePath): Promise<JobResult> => {
      return executeScriptJob(get(), kanriNo, filePath);
    },

    runJcJob: (kanriNo): Promise<void> => {
      return executeJcJob(get(), kanriNo);
    },

    /* ------------------------------------------------------------------------
     * Complete Selected Operation
     * ---------------------------------------------------------------------- */

    completeSelectedOperation: async (): Promise<void> => {
      const state = get();

      const selectedItem = selectActiveSelectedItem(state);

      if (!selectedItem) {
        return;
      }

      const currentKanriNo = String(selectedItem.kanriNo).trim();

      const activeFlags = getActiveFlagsFromState(state);

      const activeEntities = getActiveStatusEntitiesMap(state);

      const dependencyResult = checkJobDependencies(
        currentKanriNo,
        activeEntities,
        activeFlags,
      );

      if (!dependencyResult.ok) {
        showToast("前提ジョブが未完了です", "error");
        return;
      }

      suppressNextSuccessToast(currentKanriNo);

      await state.updateJobStatus({
        kanriNo: currentKanriNo,
        status: JOB_STATUS.SUCCESS,
        comment: "手動完了",
      });
    },
  };
};
