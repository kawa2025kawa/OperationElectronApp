// src/shared/store/slices/overlaySlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";

interface GlobalProcessingState {
  message: string;
  target: string;
}

export interface OverlaySlice {
  /** アプリ全体で1つだけ存在する処理中状態 */
  globalProcessing: GlobalProcessingState | null;

  /** アプリ初期化用 */
  isLoading: boolean;

  setGlobalProcessing: (processing: GlobalProcessingState | null) => void;

  setIsLoading: (isLoading: boolean) => void;
}

export const createOverlaySlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OverlaySlice
> = (set) => ({
  globalProcessing: null,

  isLoading: false,

  setGlobalProcessing: (processing) =>
    set((state: AppState) => {
      state.globalProcessing = processing;
    }),

  setIsLoading: (isLoading) =>
    set((state: AppState) => {
      state.isLoading = isLoading;
    }),
});
