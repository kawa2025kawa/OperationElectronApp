// src/renderer/store/slices/modalSlice.ts

import React from "react";
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type {
  ModalConfig,
  ModalContentType,
  ModalSize,
  ModalState,
} from "@shared/types/ui/modal";

export interface ModalSlice {
  modal: ModalState;
  openGlobalModal: (content: ModalContentType, config?: ModalConfig) => void;
  updateModalConfig: (configPartial: Partial<ModalConfig>) => void;
  closeGlobalModal: () => void;
}

/**
 * コンポーネント本体に静的に定義された modalSize を抽出する
 */
function extractComponentModalSize(
  content: ModalContentType,
): ModalSize | undefined {
  if (!content) return undefined;

  if (typeof content === "function" && "modalSize" in content) {
    return content.modalSize as ModalSize;
  }

  if (
    typeof content === "object" &&
    content !== null &&
    !React.isValidElement(content)
  ) {
    if ("modalSize" in content) {
      return (content as { modalSize?: ModalSize }).modalSize;
    }
    if (
      "type" in content &&
      typeof content.type === "function" &&
      "modalSize" in content.type
    ) {
      return (content.type as { modalSize?: ModalSize }).modalSize;
    }
  }

  if (React.isValidElement(content)) {
    const target = content.type as unknown;

    if (typeof target === "function" && "modalSize" in target) {
      return target.modalSize as ModalSize;
    }

    if (typeof target === "object" && target !== null) {
      if ("modalSize" in target) {
        return (target as { modalSize?: ModalSize }).modalSize;
      }
      if (
        "type" in target &&
        typeof target.type === "function" &&
        "modalSize" in target.type
      ) {
        return (target.type as { modalSize?: ModalSize }).modalSize;
      }
    }
  }

  return undefined;
}

/**
 * コンポーネント本体に静的に定義された modalConfig を抽出する
 */
function extractComponentModalConfig(
  content: ModalContentType,
): ModalConfig | undefined {
  if (!content) return undefined;

  let target: unknown = content;

  if (React.isValidElement(content)) {
    target = content.type;
  }

  if (
    (typeof target === "function" ||
      (typeof target === "object" && target !== null)) &&
    "modalConfig" in target
  ) {
    return (target as { modalConfig?: ModalConfig }).modalConfig;
  }

  return undefined;
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
    set((state: AppState) => {
      const componentModalSize = extractComponentModalSize(content);
      const componentModalConfig = extractComponentModalConfig(content);

      // 優先順位: コンポーネント静的サイズ < コンポーネント静的Config < 開く際の明示的Config
      const mergedConfig: ModalConfig = {
        ...componentModalSize,
        ...componentModalConfig,
        ...config,
      };

      state.modal.isOpen = true;
      state.modal.content = content;
      state.modal.config = mergedConfig;
    }),

  updateModalConfig: (configPartial) =>
    set((state: AppState) => {
      if (state.modal.config) {
        state.modal.config = {
          ...state.modal.config,
          ...configPartial,
        };
      }
    }),

  closeGlobalModal: () =>
    set((state: AppState) => {
      state.modal.isOpen = false;
      state.modal.content = null;
      state.modal.config = null;
    }),
});
