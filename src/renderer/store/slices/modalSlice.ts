// src/shared/store/slices/modalSlice.ts

import type { ReactNode } from "react";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type { GlobalModalConfig } from "@shared/types/uiType";

export interface ModalSlice {
  modalContent: ReactNode | null;
  modalConfig: GlobalModalConfig | null;

  openGlobalModal: (content: ReactNode, config?: GlobalModalConfig) => void;
  closeGlobalModal: () => void;
}

export const createModalSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  ModalSlice
> = (set) => ({
  modalContent: null,
  modalConfig: null,

  openGlobalModal: (content, config) =>
    set((state: AppState) => {
      state.modalContent = content;
      state.modalConfig = config ?? null;
    }),

  closeGlobalModal: () =>
    set((state: AppState) => {
      state.modalContent = null;
      state.modalConfig = null;
    }),
});
