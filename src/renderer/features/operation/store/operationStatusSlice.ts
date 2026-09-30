// src/renderer/features/operation/store/operationStatusSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { operationCommands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
} from "@shared/types/statusSummary/statusSummaryTypes";

/* =========================
 * Types
 * ========================= */

type StatusMap = Record<string, OperationStatusState>;

type StatusMapKey = "operationStatuses" | "irregularStatuses" | "todayStatuses";

type OperationStatusUpdate = Pick<
  OperationStatusState,
  "kanriNo" | "status" | "comment"
>;

/* =========================
 * Status Helpers
 * ========================= */

/**
 * Status更新を既存値へマージする。
 *
 * undefined:
 *   既存値を維持
 *
 * null:
 *   明示的にクリア
 *
 * status:
 *   未指定の場合は既存値、
 *   既存値もなければscheduled。
 *
 * Renderer StoreはStatusの業務判断を行わず、
 * Mainから受け取ったStatusをUI用に保持する。
 */
function mergeStatus(
  current: OperationStatusState | undefined,
  update: OperationStatusState,
): OperationStatusState {
  return {
    ...current,
    ...update,
    kanriNo: update.kanriNo,
    status: update.status ?? current?.status ?? JOB_STATUS.SCHEDULED,
    comment: update.comment ?? current?.comment ?? "",
  };
}

function isSameStatus(
  current: OperationStatusState | undefined,
  next: OperationStatusState,
): boolean {
  if (!current) {
    return false;
  }

  return (
    current.status === next.status &&
    current.comment === next.comment &&
    current.startTime === next.startTime &&
    current.endTime === next.endTime &&
    current.expectedStartTime === next.expectedStartTime &&
    current.expectedEndTime === next.expectedEndTime &&
    current.substatus === next.substatus &&
    current.info === next.info
  );
}

/* =========================
 * Status Map
 * ========================= */

function getStatusMapKey(state: AppState, kanriNo: string): StatusMapKey {
  if (state.todayIds.includes(kanriNo)) {
    return "todayStatuses";
  }

  if (state.irregularIds.includes(kanriNo)) {
    return "irregularStatuses";
  }

  return "operationStatuses";
}

function cloneStatusMaps(state: AppState): Record<StatusMapKey, StatusMap> {
  return {
    operationStatuses: {
      ...state.operationStatuses,
    },

    irregularStatuses: {
      ...state.irregularStatuses,
    },

    todayStatuses: {
      ...state.todayStatuses,
    },
  };
}

/* =========================
 * Summary
 * ========================= */

/**
 * Renderer上のStatusからUI用Summaryを算出する。
 *
 * Main側のStatus判定ロジックは持たない。
 */
function calculateSummary(
  state: Pick<
    AppState,
    "operationIds" | "todayIds" | "operationStatuses" | "todayStatuses"
  >,
): StatusSummary {
  const summary: StatusSummary = {
    ...EMPTY_STATUS_SUMMARY,

    total: state.operationIds.length + state.todayIds.length,
  };

  const targetIds = new Set<string>([...state.operationIds, ...state.todayIds]);

  for (const kanriNo of targetIds) {
    const status =
      state.operationStatuses[kanriNo]?.status ??
      state.todayStatuses[kanriNo]?.status;

    if (!status || !(status in summary)) {
      continue;
    }

    summary[status] += 1;
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  return summary;
}

/* =========================
 * State Update
 * ========================= */

/**
 * Mainから受信した正規化済みOperationStatusStateを
 * Renderer Storeへ反映する。
 *
 * Statusの正本はMain側。
 * Renderer StoreはUIミラーとして保持する。
 */
function applyStatusUpdates(
  state: AppState,
  updates: readonly OperationStatusState[],
): AppState | Partial<AppState> {
  if (updates.length === 0) {
    return state;
  }

  const statusMaps = cloneStatusMaps(state);

  let changed = false;

  for (const update of updates) {
    const kanriNo = update.kanriNo.trim();

    if (!kanriNo) {
      continue;
    }

    const mapKey = getStatusMapKey(state, kanriNo);

    const current = statusMaps[mapKey][kanriNo];

    const next = mergeStatus(current, {
      ...update,
      kanriNo,
    });

    if (isSameStatus(current, next)) {
      continue;
    }

    statusMaps[mapKey][kanriNo] = next;

    changed = true;
  }

  if (!changed) {
    return state;
  }

  return {
    operationStatuses: statusMaps.operationStatuses,

    irregularStatuses: statusMaps.irregularStatuses,

    todayStatuses: statusMaps.todayStatuses,

    summary: calculateSummary({
      operationIds: state.operationIds,

      todayIds: state.todayIds,

      operationStatuses: statusMaps.operationStatuses,

      todayStatuses: statusMaps.todayStatuses,
    }),
  };
}

/* =========================
 * Public Slice
 * ========================= */

export interface OperationStatusSlice {
  operationStatuses: StatusMap;
  irregularStatuses: StatusMap;
  todayStatuses: StatusMap;
  summary: StatusSummary;

  applyOperationStatusUpdates(updates: OperationStatusState[]): void;

  updateOperationStatus(update: OperationStatusUpdate): void;

  refreshStatusSummary(): void;

  resetAllOperationStatuses(): Promise<void>;
}

/* =========================
 * Slice
 * ========================= */

export const createOperationStatusSlice: StateCreator<
  AppState,
  [],
  [],
  OperationStatusSlice
> = (set, get) => ({
  operationStatuses: {},
  irregularStatuses: {},
  todayStatuses: {},

  summary: {
    ...EMPTY_STATUS_SUMMARY,
  },

  /* =========================
   * IPC Status Sync
   * ========================= */

  applyOperationStatusUpdates: (updates) => {
    if (updates.length === 0) {
      return;
    }

    set((state) => applyStatusUpdates(state, updates));
  },

  /* =========================
   * Manual Status Update
   * ========================= */

  updateOperationStatus: (update) => {
    const kanriNo = update.kanriNo.trim();

    if (!kanriNo || !update.status) {
      return;
    }

    /*
     * Status変更はMain側を正本とする。
     *
     * Rendererでは楽観更新せず、
     * Mainから返される
     * operation:status-updated
     * を通してStoreを更新する。
     */
    void operationCommands
      .updateJobStatus(kanriNo, update.status, update.comment ?? "")
      .catch((error) => {
        console.error("[Store] updateOperationStatus Error:", error);
      });
  },

  /* =========================
   * Summary
   * ========================= */

  refreshStatusSummary: () => {
    set((state) => ({
      summary: calculateSummary(state),
    }));
  },

  /* =========================
   * Reset
   * ========================= */

  resetAllOperationStatuses: async () => {
    try {
      /*
       * Resetの実体はMain側で行う。
       *
       * Mainから返された正規化済みStatusを
       * Renderer Storeへ反映する。
       */
      const resetStatuses = await operationCommands.resetOperationStatuses();

      const updates = Object.values(resetStatuses);

      if (updates.length === 0) {
        get().refreshStatusSummary();
      } else {
        get().applyOperationStatusUpdates(updates);
      }

      toast.success("ステータスを初期化しました");
    } catch (error) {
      console.error("[Store] resetAllOperationStatuses Error:", error);

      toast.error("ステータスの初期化に失敗しました");

      throw error;
    }
  },
});
