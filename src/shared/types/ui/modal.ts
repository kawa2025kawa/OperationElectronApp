// src/shared/types/ui/modal.ts

import type { ReactNode, ComponentType } from "react";

export interface ModalSize {
  width?: string;
  height?: string;
}

export type ModalContentType = ReactNode | ComponentType<object>;

export type ModalMessageType = "info" | "success" | "error" | "warning";

/**
 * 🎯 TS2304 解消: 動的メッセージ用の設定型
 */
export interface ModalMessageConfig {
  text: string;
  type?: ModalMessageType;
}

export interface ModalConfig extends ModalSize {
  title?: string;
  hideFooter?: boolean;
  footerContent?: ReactNode;

  // ヘッダー下部の動的メッセージ領域
  message?: ModalMessageConfig | null;

  // ボタン・実行制御
  confirmText?: string;
  cancelText?: string;
  isConfirmDisabled?: boolean;
  isProcessing?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * 🎯 TS2305 解消: モーダル全体の状態型をエクスポート
 */
export interface ModalState {
  isOpen: boolean;
  content: ModalContentType | null;
  config: ModalConfig | null;
}

/**
 * ツール一覧やメニューで自動登録するためのメタ情報
 */
export interface ModalMeta {
  id: string;
  name: string;
}

/**
 * モーダルコンポーネントに付与する静的プロパティの型定義
 */
export type GlobalModalComponent<P = object> = ComponentType<P> & {
  modalMeta?: ModalMeta;
  modalConfig?: ModalConfig;
  modalSize?: ModalSize;
};
