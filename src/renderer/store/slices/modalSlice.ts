// src/renderer/store/slices/modalSlice.ts

import type { ReactNode } from "react";
import type { StateCreator } from "zustand";

import type { AppState } from "@renderer/store";
import type { ModalConfig, ModalState } from "@shared/types/ui/modal";

export interface ModalSlice {
  modal: ModalState;
  openGlobalModal: (content: ReactNode, config?: ModalConfig) => void;
  updateModalConfig: (configPartial: Partial<ModalConfig>) => void;
  closeGlobalModal: () => void;
}

export const createModalSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  ModalSlice
> = (set) => ({
  modal: {
    isOpen: false,
    content: null,
    config: null,
  },

  openGlobalModal: (content, config) =>
    set((state) => {
      state.modal.isOpen = true;
      state.modal.content = content;
      state.modal.config = config ?? {};
    }),

  updateModalConfig: (configPartial) =>
    set((state) => {
      if (!state.modal.config) {
        return;
      }

      state.modal.config = {
        ...state.modal.config,
        ...configPartial,
      };
    }),

  closeGlobalModal: () =>
    set((state) => {
      state.modal.isOpen = false;
      state.modal.content = null;
      state.modal.config = null;
    }),
});
