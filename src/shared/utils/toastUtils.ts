// src/shared/utils/toastUtils.ts

import {
  usePollingToastStore,
  type ToastType,
} from "@renderer/components/ui/toast/pollingToastStore";

export type { ToastType };

/**
 * アプリ共通のトースト通知呼び出し関数
 */
export const showToast = (message: string, type: ToastType = "info"): void => {
  usePollingToastStore.getState().addToast(message, type);
};
