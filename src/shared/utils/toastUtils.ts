// src/shared/utils/toastUtils.ts

import {
  useToastStore,
  type ToastType,
} from "@renderer/components/ui/toast/toastStore";

export type { ToastType };

/**
 * アプリ共通のトースト通知呼び出し関数
 */
export const showToast = (message: string, type: ToastType = "info"): void => {
  useToastStore.getState().addToast(message, type);
};

/**
 * エラー通知用ショートカット関数
 */
export const showErrorToast = (error: unknown, prefix?: string): void => {
  const message = error instanceof Error ? error.message : String(error);
  const finalMessage = prefix ? `${prefix}: ${message}` : message;

  showToast(finalMessage, "error");
};
