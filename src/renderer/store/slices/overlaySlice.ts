// src/renderer/store/slices/overlaySlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";

export interface GlobalProcessingState {
  message: string;
  target?: string;
}

export interface OverlaySlice {
  /** ユーザー操作（JC・スクリプト実行等）に伴う処理中状態 */
  globalProcessing: GlobalProcessingState | null;

  /** 処理中状態の更新ハンドラー */
  setGlobalProcessing: (processing: GlobalProcessingState | null) => void;
}

// 画面全体の処理中ローディングオーバーレイ表示を管理するスライスを生成する。
export const createOverlaySlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OverlaySlice
> = (set) => ({
  globalProcessing: null,

  // 処理中メッセージおよび対象を含むグローバル処理中ステートを設定する。
  setGlobalProcessing: (processing) =>
    set((state: AppState) => {
      state.globalProcessing = processing;
    }),
});
