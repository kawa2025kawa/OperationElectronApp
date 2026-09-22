// src/shared/store/slices/overlaySlice.ts

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

export const createOverlaySlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OverlaySlice
> = (set) => ({
  globalProcessing: null,

  setGlobalProcessing: (processing) =>
    set((state: AppState) => {
      state.globalProcessing = processing;
    }),
});
