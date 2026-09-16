// src/shared/types/ui/modal.ts

import type { ReactNode, ComponentType } from "react";

export interface ModalSize {
  width?: string;
  height?: string;
}

export type ModalContentType = ReactNode | ComponentType<object>;

export type ModalMessageType = "info" | "success" | "error" | "warning";

export interface ModalMessageConfig {
  text: string;
  type?: ModalMessageType;
}

/**
 * 🎯 モーダルフッターに配置する動的ボタンの仕様定義データ
 */
export interface ModalAction {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "default" | "tab" | "pill"; // 🎯 ActionButtonProps の variant 型に統一
  disabled?: boolean;
}

export interface ModalConfig extends ModalSize {
  title?: string;
  hideFooter?: boolean;

  /** 左側に配置したい動的アクションボタン群 (例: Excel, PDF, 一括クリア) */
  leftActions?: ModalAction[];

  /** 右側に配置したい動的アクションボタン群 (例: キャンセル, 実行, 閉じる) */
  rightActions?: ModalAction[];

  /** フッター領域全体の完全上書き用 (レガシー/例外用) */
  footerContent?: ReactNode;

  // メッセージ・状態制御
  message?: ModalMessageConfig | null;
  isProcessing?: boolean;

  // 後方互換性用（単一アクション指定時）
  confirmText?: string;
  cancelText?: string;
  isConfirmDisabled?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ModalState {
  isOpen: boolean;
  content: ModalContentType | null;
  config: ModalConfig | null;
}

export interface ModalMeta {
  id: string;
  name: string;
}

export type GlobalModalComponent<P = object> = ComponentType<P> & {
  modalMeta?: ModalMeta;
  modalConfig?: ModalConfig;
  modalSize?: ModalSize;
};
