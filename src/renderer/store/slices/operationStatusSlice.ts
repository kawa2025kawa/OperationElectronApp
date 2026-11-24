// src/renderer/store/slices/operationStatusSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
import { operationService } from "@renderer/features/operation/service/operationService";
import type { AppState } from "@renderer/store";
import type { ViewMode } from "@renderer/registry/appRegistry";
import type {
  OperationStatusNotification,
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

type OperationStatusUpdate = Pick<
  OperationStatusState,
  "kanriNo" | "status" | "comment"
>;

const ALL_VIEW_MODES: readonly ViewMode[] = ["operation", "irregular", "today"];

/** 表示モードに対応する最新の行配列を取得する共通セレクタ */
export function selectRowsForMode(
  state: Pick<
    OperationStatusSlice,
    "tableRows" | "tableRowsMode" | "tableRowsByMode"
  >,
  mode: ViewMode,
): OperationViewItem[] {
  return state.tableRowsMode === mode
    ? state.tableRows
    : (state.tableRowsByMode[mode] ?? []);
}

/** Operation と TODAY の行データを重複排除して合算する共通セレクタ */
export function selectMergedOperationAndTodayRows(
  state: Pick<
    OperationStatusSlice,
    "tableRows" | "tableRowsMode" | "tableRowsByMode"
  >,
): OperationViewItem[] {
  const operationRows = selectRowsForMode(state, "operation");
  const todayRows = selectRowsForMode(state, "today");
  const seenKanriNos = new Set<string>();
  const merged: OperationViewItem[] = [];

  for (const row of [...operationRows, ...todayRows]) {
    const key = row.kanriNo.trim();
    if (!key || seenKanriNos.has(key)) continue;
    seenKanriNos.add(key);
    merged.push(row);
  }

  return merged;
}

/** 行データに対してステータス通知の差分を適用する */
function applyNotificationToRow(
  row: OperationViewItem,
  notification: OperationStatusNotification,
): void {
  if (notification.type === "updated") {
    const { update } = notification;
    if (update.status !== undefined) row.status = update.status;
    if (update.comment !== undefined) row.comment = update.comment;
    if (update.startTime !== undefined) row.startTime = update.startTime;
    if (update.endTime !== undefined) row.endTime = update.endTime;
  } else if (notification.type === "cleared") {
    delete row.status;
    row.comment = "";
    delete row.startTime;
    delete row.endTime;
  }
}

/** tableRows と全モードキャッシュの該当行に対して重複なく一括更新を適用する */
function forEachCachedRow(
  state: AppState,
  updater: (row: OperationViewItem, kanriNo: string) => void,
): void {
  const uniqueLists = new Set<OperationViewItem[]>([state.tableRows]);
  for (const mode of ALL_VIEW_MODES) {
    const modeRows = state.tableRowsByMode[mode];
    if (modeRows) uniqueLists.add(modeRows);
  }

  for (const rows of uniqueLists) {
    for (const row of rows) {
      const kanriNo = row.kanriNo?.trim();
      if (kanriNo) {
        updater(row, kanriNo);
      }
    }
  }
}

export interface OperationStatusSlice {
  tableRows: OperationViewItem[];
  tableRowsMode: ViewMode | null;
  tableRowsByMode: Record<ViewMode, OperationViewItem[]>;
  isTableLoading: boolean;
  isMergedSummaryLoading: boolean;
  fetchTableData: (mode: ViewMode, force?: boolean) => Promise<void>;
  ensureOperationAndTodayData: () => Promise<void>;
  applyOperationStatusUpdates: (
    notifications: OperationStatusNotification[],
  ) => void;
  updateOperationStatus: (update: OperationStatusUpdate) => void;
  resetAllOperationStatuses: () => Promise<void>;
}

export const createOperationStatusSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationStatusSlice
> = (set, get) => {
  let tableDataRequestId = 0;

  return {
    tableRows: [],
    tableRowsMode: null,
    tableRowsByMode: {
      operation: [],
      irregular: [],
      today: [],
    },
    isTableLoading: false,
    isMergedSummaryLoading: false,

    fetchTableData: async (mode, force = false) => {
      const currentCache = get().tableRowsByMode[mode];
      if (!force && currentCache && currentCache.length > 0) {
        set((state) => {
          state.tableRows = state.tableRowsByMode[mode];
          state.tableRowsMode = mode;
          state.isTableLoading = false;
        });
        return;
      }

      const requestId = ++tableDataRequestId;
      set((state) => {
        state.isTableLoading = true;
      });

      try {
        const data = await operationService.getTableData(mode);
        if (requestId !== tableDataRequestId || get().currentMode !== mode) {
          return;
        }

        set((state) => {
          state.tableRowsByMode[mode] = data;
          state.tableRows = state.tableRowsByMode[mode];
          state.tableRowsMode = mode;
        });
      } catch (error) {
        if (requestId === tableDataRequestId) {
          console.error("[OperationStore] Failed to fetch table data:", error);
        }
        throw error;
      } finally {
        if (requestId === tableDataRequestId) {
          set((state) => {
            state.isTableLoading = false;
          });
        }
      }
    },

    ensureOperationAndTodayData: async () => {
      const targetModes: readonly ViewMode[] = ["operation", "today"];
      const missingModes = targetModes.filter(
        (mode) => get().tableRowsByMode[mode].length === 0,
      );

      if (missingModes.length === 0) return;

      set((state) => {
        state.isMergedSummaryLoading = true;
      });

      try {
        const results = await Promise.all(
          missingModes.map(async (mode) => ({
            mode,
            data: await operationService.getTableData(mode),
          })),
        );

        set((state) => {
          for (const { mode, data } of results) {
            state.tableRowsByMode[mode] = data;
            if (state.currentMode === mode) {
              state.tableRows = data;
              state.tableRowsMode = mode;
            }
          }
        });
      } finally {
        set((state) => {
          state.isMergedSummaryLoading = false;
        });
      }
    },

    applyOperationStatusUpdates: (notifications) => {
      if (notifications.length === 0) return;

      const notificationMap = new Map<string, OperationStatusNotification>();
      for (const notification of notifications) {
        const kanriNo = (
          notification.type === "updated"
            ? notification.update.kanriNo
            : notification.kanriNo
        )?.trim();

        if (kanriNo) {
          notificationMap.set(kanriNo, notification);
        }
      }

      if (notificationMap.size === 0) return;

      set((state) => {
        forEachCachedRow(state, (row, kanriNo) => {
          const notification = notificationMap.get(kanriNo);
          if (notification) {
            applyNotificationToRow(row, notification);
          }
        });
      });

      void get().fetchStatusSummary();
    },

    updateOperationStatus: (update) => {
      const kanriNo = update.kanriNo.trim();
      if (!kanriNo || !update.status) return;

      set((state) => {
        forEachCachedRow(state, (row, rowKanriNo) => {
          if (rowKanriNo === kanriNo) {
            row.status = update.status;
            row.comment = update.comment ?? "";
          }
        });
      });

      void get().fetchStatusSummary();

      void operationService
        .updateJobStatus({
          kanriNo,
          status: update.status,
          comment: update.comment ?? "",
        })
        .catch((error: unknown) => {
          console.error("[OperationStore] updateOperationStatus Error:", error);
        });
    },

    resetAllOperationStatuses: async () => {
      try {
        await operationService.resetStatuses();
        tableDataRequestId += 1;
        usePollingToastStore.getState().resetToastState();

        set((state) => {
          state.isPolling = false;
          state.tableRows = [];
          state.tableRowsByMode = {
            operation: [],
            irregular: [],
            today: [],
          };
        });

        await Promise.all([
          get().fetchTableData(get().currentMode, true),
          get().fetchStatusSummary(),
        ]);

        toast.success("ステータスを初期化しました");
      } catch (error) {
        console.error(
          "[OperationStore] resetAllOperationStatuses Error:",
          error,
        );
        toast.error("ステータスの初期化に失敗しました");
        throw error;
      }
    },
  };
};
