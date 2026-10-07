// src/shared/types/ui/modal.ts

import type { ComponentType, ReactNode } from "react";

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
