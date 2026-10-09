// src/renderer/features/operation/store/operationStatusSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { trpc } from "@renderer/lib/trpc";
import type { AppState } from "@renderer/store";

import {
  JOB_STATUS,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

/* =========================
 * Types
 * ========================= */

type StatusMap = Record<string, OperationStatusState>;

type OperationStatusUpdate = Pick<
  OperationStatusState,
  "kanriNo" | "status" | "comment"
>;

/* =========================
 * Status Helpers
 * ========================= */

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
 * State Update (Single Map Unified)
 * ========================= */

function applyStatusUpdates(
  state: AppState,
  updates: readonly OperationStatusState[],
): Partial<AppState> {
  if (updates.length === 0) {
    return state;
  }

  let nextStatuses: StatusMap | null = null;

  for (const update of updates) {
    const kanriNo = update.kanriNo.trim();

    if (!kanriNo) {
      continue;
    }

    const currentMap = nextStatuses ?? state.operationStatuses;
    const current = currentMap[kanriNo];
    const next = mergeStatus(current, {
      ...update,
      kanriNo,
    });

    if (isSameStatus(current, next)) {
      continue;
    }

    if (!nextStatuses) {
      nextStatuses = { ...state.operationStatuses };
    }

    nextStatuses[kanriNo] = next;
  }

  if (!nextStatuses) {
    return state;
  }

  return {
    operationStatuses: nextStatuses,
    irregularStatuses: nextStatuses,
    todayStatuses: nextStatuses,
  };
}

/* =========================
 * Public Slice Interface
 * ========================= */

export interface OperationStatusSlice {
  operationStatuses: StatusMap;
  irregularStatuses: StatusMap;
  todayStatuses: StatusMap;

  applyOperationStatusUpdates(updates: OperationStatusState[]): void;
  updateOperationStatus(update: OperationStatusUpdate): void;
  resetAllOperationStatuses(): Promise<void>;
}

/* =========================
 * Slice Creator
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

  /* =========================
   * IPC Status Sync
   * ========================= */

  applyOperationStatusUpdates: (updates) => {
    if (updates.length === 0) return;

    set((state) => applyStatusUpdates(state, updates));
    void get().fetchStatusSummary();
  },

  /* =========================
   * Manual Status Update
   * ========================= */

  updateOperationStatus: (update) => {
    const kanriNo = update.kanriNo.trim();

    if (!kanriNo || !update.status) {
      return;
    }

    void trpc.operation.updateJobStatus
      .mutate({
        kanriNo,
        status: update.status,
        comment: update.comment ?? "",
      })
      .catch((error: unknown) => {
        console.error("[Store] updateOperationStatus Error:", error);
      });
  },

  /* =========================
   * Reset
   * ========================= */

  resetAllOperationStatuses: async () => {
    try {
      const resetStatuses = await trpc.operation.resetStatuses.mutate();
      const updates = Object.values(resetStatuses);

      if (updates.length === 0) {
        await get().fetchStatusSummary();
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

