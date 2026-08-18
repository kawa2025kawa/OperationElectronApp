// src/shared/utils/toastUtils.ts

import {
  useToastStore,
  type ToastType,
} from "@renderer/components/ui/toast/toastStore";

export type { ToastType };

/**
 * アプリ共通のトースト通知呼び出し関数
 */
export const showToast = (
  message: string,
  type: ToastType = "info",
  duration = 4000,
): void => {
  // エラー時は自動消去時間を長め（8秒）に設定、それ以外は4秒
  const toastDuration = type === "error" ? 8000 : duration;
  useToastStore.getState().addToast(message, type, toastDuration);
};

/**
 * エラー通知用ショートカット関数
 */
export const showErrorToast = (error: unknown, prefix?: string): void => {
  const message = error instanceof Error ? error.message : String(error);
  const finalMessage = prefix ? `${prefix}: ${message}` : message;

  showToast(finalMessage, "error");
};
