// src/renderer/features/operation/store/operationStatusSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { AppState } from "@renderer/store";
import type { ViewMode } from "@renderer/registry/appRegistry";
import type {
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

type StatusMap = Record<string, OperationStatusState>;
type OperationStatusUpdate = Pick<
  OperationStatusState,
  "kanriNo" | "status" | "comment"
>;

export interface OperationStatusSlice {
  operationStatuses: StatusMap;
  tableRows: OperationViewItem[];
  isTableLoading: boolean;
  fetchTableData: (mode: ViewMode) => Promise<void>;
  applyOperationStatusUpdates: (updates: OperationStatusState[]) => void;
  updateOperationStatus: (update: OperationStatusUpdate) => void;
  resetAllOperationStatuses: () => Promise<void>;
}

export const createOperationStatusSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationStatusSlice
> = (set, get) => ({
  operationStatuses: {},
  tableRows: [],
  isTableLoading: false,

  fetchTableData: async (mode: ViewMode) => {
    try {
      set((state) => {
        state.isTableLoading = true;
      });
      const data = await window.electronAPI.invoke(
        IPC_CHANNELS.OPERATION.GET_TABLE_DATA,
        { mode },
      );
      set((state) => {
        state.tableRows = data;
      });
    } catch (error) {
      console.error("[OperationStore] Failed to fetch table data:", error);
    } finally {
      set((state) => {
        state.isTableLoading = false;
      });
    }
  },

  applyOperationStatusUpdates: (updates) => {
    if (updates.length === 0) return;

    set((state) => {
      for (const update of updates) {
        const kanriNo = update.kanriNo?.trim();
        if (!kanriNo) continue;

        // 1. ステータスマップの更新
        const current = state.operationStatuses[kanriNo];
        state.operationStatuses[kanriNo] = {
          ...current,
          ...update,
          kanriNo,
          comment: update.comment ?? current?.comment ?? "",
        };

        // 2. テーブル行が存在する場合は直接インプレース更新（全件再フェッチを回避）
        const targetRow = state.tableRows.find(
          (row) => row.kanriNo === kanriNo,
        );
        if (targetRow) {
          if (update.status !== undefined) targetRow.status = update.status;
          if (update.comment !== undefined) targetRow.comment = update.comment;
          if (update.startTime !== undefined)
            targetRow.startTime = update.startTime;
          if (update.endTime !== undefined) targetRow.endTime = update.endTime;
        }
      }
    });

    void get().fetchStatusSummary();
  },

  updateOperationStatus: (update) => {
    const kanriNo = update.kanriNo.trim();
    if (!kanriNo || !update.status) {
      return;
    }
    void window.electronAPI
      .invoke(IPC_CHANNELS.OPERATION.UPDATE_JOB_STATUS, {
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
      const resetStatuses = await window.electronAPI.invoke(
        IPC_CHANNELS.OPERATION.RESET_STATUSES,
      );
      const updates = Object.values(resetStatuses);
      if (updates.length === 0) {
        await get().fetchStatusSummary();
      } else {
        get().applyOperationStatusUpdates(updates);
      }
      toast.success("ステータスを初期化しました");
    } catch (error) {
      console.error("[OperationStore] resetAllOperationStatuses Error:", error);
      toast.error("ステータスの初期化に失敗しました");
      throw error;
    }
  },
});
