// src/renderer/store/slices/operationStatusSlice.ts

import { toast } from "sonner";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type { ViewMode } from "@renderer/registry/appRegistry";
import type {
  OperationStatusState,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";
import { operationService } from "@renderer/features/operation/operationService";

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

// 運用ジョブステータスおよびテーブル表示データを管理するスライスを生成する。
export const createOperationStatusSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OperationStatusSlice
> = (set, get) => ({
  operationStatuses: {},
  tableRows: [],
  isTableLoading: false,

  // 指定モードに応じた運用テーブル行データをバックエンドから取得する。
  fetchTableData: async (mode: ViewMode) => {
    try {
      set((state) => {
        state.isTableLoading = true;
      });
      const data = await operationService.getTableData(mode);
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

  // 複数のステータス更新をステータスマップおよび表示テーブル行へインプレース反映する（O(N+M) 最適化）。
  applyOperationStatusUpdates: (updates) => {
    if (updates.length === 0) return;

    set((state) => {
      // 1. 更新マップを作成し、O(1) で引けるようにする
      const updateMap = new Map<string, OperationStatusState>();
      for (const update of updates) {
        const kanriNo = update.kanriNo?.trim();
        if (!kanriNo) continue;

        updateMap.set(kanriNo, update);

        const current = state.operationStatuses[kanriNo];
        state.operationStatuses[kanriNo] = {
          ...current,
          ...update,
          kanriNo,
          comment: update.comment ?? current?.comment ?? "",
        };
      }

      // 2. テーブル行が存在する場合は 1 パスで更新
      if (updateMap.size > 0 && state.tableRows.length > 0) {
        for (const row of state.tableRows) {
          const update = updateMap.get(row.kanriNo);
          if (!update) continue;

          if (update.status !== undefined) row.status = update.status;
          if (update.comment !== undefined) row.comment = update.comment;
          if (update.startTime !== undefined) row.startTime = update.startTime;
          if (update.endTime !== undefined) row.endTime = update.endTime;
        }
      }
    });

    void get().fetchStatusSummary();
  },

  // 指定管理Noのジョブステータス更新をバックエンドへ要求する。
  updateOperationStatus: (update) => {
    const kanriNo = update.kanriNo.trim();
    if (!kanriNo || !update.status) {
      return;
    }
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

  // 全ステータスを初期化し、マスタデータとテーブル表示を初期状態にリセットする。
  resetAllOperationStatuses: async () => {
    try {
      const resetStatuses = await operationService.resetStatuses();

      await get().fetchMasterData();

      set((state) => {
        state.operationStatuses = resetStatuses;
      });

      await get().fetchStatusSummary();
      await get().fetchTableData(get().currentMode);

      toast.success("ステータスを初期化しました");
    } catch (error) {
      console.error("[OperationStore] resetAllOperationStatuses Error:", error);
      toast.error("ステータスの初期化に失敗しました");
      throw error;
    }
  },
});
