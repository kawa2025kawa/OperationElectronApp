// src/shared/types/ui/modal.ts

import type { ComponentType, ReactNode } from "react";

export interface ModalDimension {
  readonly width: string;
  readonly height: string;
}

export const MODAL_SIZES = {
  DEFAULT: {
    width: "min(85vw, 850px)",
    height: "min(75vh, 650px)",
  },
  WIDE_16_9: {
    width: "min(85vw, calc(75vh * 16 / 9))",
    height: "min(75vh, calc(85vw * 9 / 16))",
  },
  ULTRA_WIDE_21_9: {
    width: "min(95vw, calc(75vh * (21 / 9)))",
    height: "min(75vh, calc(95vw * (9 / 21)))",
  },
  LARGE_LIST: {
    width: "min(85vw, 800px)",
    height: "min(80vh, 700px)",
  },
  KOKYUHYO: {
    width: "90vw",
    height: "85vh",
  },
  SHOP: {
    width: "80vw",
    height: "80vh",
  },
} as const satisfies Record<string, ModalDimension>;

export type ModalSizePresetKey = keyof typeof MODAL_SIZES;

/**
 * モーダルタイトルの定義（一元管理）
 */
export const MODAL_TITLES = {
  PDF_UPLOAD: "Tempomatic PDF",
  LINK_LIST: "リンク一覧",
} as const;

/**
 * モーダルメタ情報・基本構成プリセット
 */
export const MODAL_PRESETS = {
  PDF_UPLOAD: {
    title: MODAL_TITLES.PDF_UPLOAD,
    ...MODAL_SIZES.ULTRA_WIDE_21_9,
  },
  SCRIPT_EXECUTION: {
    ...MODAL_SIZES.WIDE_16_9,
  },
  LINK_LIST: {
    title: MODAL_TITLES.LINK_LIST,
    ...MODAL_SIZES.LARGE_LIST,
  },
} as const satisfies Record<string, ModalConfig>;

export type ModalMessageType = "info" | "success" | "error" | "warning";

export interface ModalMessageConfig {
  text: string;
  type?: ModalMessageType;
}

export interface ModalAction {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "default" | "tab" | "pill";
  disabled?: boolean;
}

export interface ModalConfig {
  width?: string;
  height?: string;

  title?: string;
  hideFooter?: boolean;

  leftActions?: ModalAction[];
  rightActions?: ModalAction[];

  footerContent?: ReactNode;

  message?: ModalMessageConfig | null;
  isProcessing?: boolean;

  confirmText?: string;
  cancelText?: string;
  isConfirmDisabled?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ModalState {
  isOpen: boolean;
  content: ReactNode | null;
  config: ModalConfig | null;
}

export interface ModalMeta {
  id: string;
  name: string;
}

export type GlobalModalComponent<P = object> = ComponentType<P> & {
  modalMeta?: ModalMeta;
};
