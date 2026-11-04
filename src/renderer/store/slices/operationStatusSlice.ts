// src/renderer/store/slices/operationStatusSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

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

export interface OperationStatusSlice {
  tableRows: OperationViewItem[];
  tableRowsMode: ViewMode | null;
  tableRowsByMode: Record<ViewMode, OperationViewItem[]>;
  isTableLoading: boolean;
  fetchTableData: (mode: ViewMode, force?: boolean) => Promise<void>;
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

    fetchTableData: async (mode, force = false) => {
      // キャッシュが存在し強制再取得でない場合は即座にキャッシュを反映して完了
      const currentCache = get().tableRowsByMode[mode];
      if (!force && currentCache && currentCache.length > 0) {
        set((state) => {
          state.tableRows = currentCache;
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
          state.tableRows = data;
          state.tableRowsMode = mode;
          state.tableRowsByMode[mode] = data;
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
        // 現在表示中の行を更新
        for (const row of state.tableRows) {
          const rowKanriNo = row.kanriNo?.trim();
          if (!rowKanriNo) continue;

          const notification = notificationMap.get(rowKanriNo);
          if (notification) {
            applyNotificationToRow(row, notification);
          }
        }

        // キャッシュされている全モードの行も同期更新
        const modes: ViewMode[] = ["operation", "irregular", "today"];
        for (const mode of modes) {
          const cachedRows = state.tableRowsByMode[mode];
          if (cachedRows) {
            for (const row of cachedRows) {
              const rowKanriNo = row.kanriNo?.trim();
              if (!rowKanriNo) continue;

              const notification = notificationMap.get(rowKanriNo);
              if (notification) {
                applyNotificationToRow(row, notification);
              }
            }
          }
        }
      });

      void get().fetchStatusSummary();
    },

    updateOperationStatus: (update) => {
      const kanriNo = update.kanriNo.trim();
      if (!kanriNo || !update.status) return;

      set((state) => {
        const targetRow = state.tableRows.find(
          (row) => row.kanriNo?.trim() === kanriNo,
        );
        if (targetRow) {
          targetRow.status = update.status;
          targetRow.comment = update.comment ?? "";
        }

        const modes: ViewMode[] = ["operation", "irregular", "today"];
        for (const mode of modes) {
          const cached = state.tableRowsByMode[mode]?.find(
            (row) => row.kanriNo?.trim() === kanriNo,
          );
          if (cached) {
            cached.status = update.status;
            cached.comment = update.comment ?? "";
          }
        }
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

        set((state) => {
          state.isPolling = false;
          state.tableRowsByMode = {
            operation: [],
            irregular: [],
            today: [],
          };
        });

        await get().fetchTableData(get().currentMode, true);
        await get().fetchStatusSummary();

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
