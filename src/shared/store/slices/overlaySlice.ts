// src/shared/store/slices/overlaySlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";

export interface OverlaySlice {
  /** 全体処理Overlay */
  isGlobalProcessing: boolean;
  overlayMessage: string;

  /** JC / Script実行中の対象表示 */
  processingTarget: string | null;
  isLoading: boolean;

  setGlobalProcessing: (
    isProcessing: boolean,
    message?: string,
    target?: string | null,
  ) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const createOverlaySlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  OverlaySlice
> = (set) => ({
  isGlobalProcessing: false,
  overlayMessage: "",
  processingTarget: null,
  isLoading: false,

  setGlobalProcessing: (isProcessing, message = "", target = null) =>
    set((state: AppState) => {
      state.isGlobalProcessing = isProcessing;
      state.overlayMessage = message;
      state.processingTarget = isProcessing ? target : null;
    }),

  setIsLoading: (isLoading) =>
    set((state: AppState) => {
      state.isLoading = isLoading;
    }),
});
