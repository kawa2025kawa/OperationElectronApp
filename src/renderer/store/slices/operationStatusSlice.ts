// src/renderer/store/slices/operationStatusSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";

import { operationService } from "@renderer/features/operation/operationService";
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
  isTableLoading: boolean;
  fetchTableData: (mode: ViewMode) => Promise<void>;
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
    isTableLoading: false,

    fetchTableData: async (mode) => {
      const requestId = ++tableDataRequestId;

      set((state) => {
        state.isTableLoading = true;
      });

      try {
        const data = await operationService.getTableData(mode);

        // 後から開始されたリクエストまたはモードが切り替わっている場合は反映を破棄
        if (requestId !== tableDataRequestId || get().currentMode !== mode) {
          return;
        }

        set((state) => {
          state.tableRows = data;
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

    applyOperationStatusUpdates: (notifications) => {
      if (notifications.length === 0) return;

      // kanriNo ごとに最新の通知をマップ化
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
        for (const row of state.tableRows) {
          const notification = notificationMap.get(row.kanriNo);
          if (notification) {
            applyNotificationToRow(row, notification);
          }
        }
      });

      void get().fetchStatusSummary();
    },

    updateOperationStatus: (update) => {
      const kanriNo = update.kanriNo.trim();
      if (!kanriNo || !update.status) return;

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

        await get().fetchTableData(get().currentMode);
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
