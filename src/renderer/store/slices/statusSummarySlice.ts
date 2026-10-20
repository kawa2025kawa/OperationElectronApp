// src/renderer/store/slices/statusSummarySlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
} from "@shared/types/statusSummary/statusSummaryTypes";
import { operationService } from "@renderer/features/operation/operationService";

export interface StatusSummarySlice {
  summary: StatusSummary;
  fetchStatusSummary(): Promise<void>;
  setStatusSummary(summary: StatusSummary): void;
}

// 運用ジョブのステータス集計サマリーを管理するスライスを生成する。
export const createStatusSummarySlice: StateCreator<
  AppState,
  [],
  [],
  StatusSummarySlice
> = (set) => ({
  summary: {
    ...EMPTY_STATUS_SUMMARY,
  },

  // バックエンドから最新のステータス集計サマリーを取得してステートに反映する。
  fetchStatusSummary: async () => {
    try {
      const summary = await operationService.getStatusSummary();
      set({ summary });
    } catch (error) {
      console.error("[StatusSummaryStore] fetchStatusSummary Error:", error);
    }
  },

  // ステータス集計サマリーを直接ステートに設定する。
  setStatusSummary: (summary) => {
    set({ summary });
  },
});
