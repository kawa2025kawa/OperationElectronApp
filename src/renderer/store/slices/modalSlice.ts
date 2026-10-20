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

// アプリケーション共通のモーダル表示状態および操作を管理するスライスを生成する。
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

  // モーダルコンテンツと設定を受け取り、グローバルモーダルを開く。
  openGlobalModal: (content, config) =>
    set((state) => {
      state.modal.isOpen = true;
      state.modal.content = content;
      state.modal.config = config ?? {};
    }),

  // 表示中のモーダルの設定情報（ボタンやメッセージ等）を部分更新する。
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

  // グローバルモーダルを閉じ、コンテンツと設定を初期化する。
  closeGlobalModal: () =>
    set((state) => {
      state.modal.isOpen = false;
      state.modal.content = null;
      state.modal.config = null;
    }),
});
