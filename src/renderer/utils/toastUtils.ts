// src/renderer/utils/toastUtils.ts

import {
  usePollingToastStore,
  type ToastType,
} from "@renderer/components/ui/toast/pollingToastStore";

export const showToast = (
  message: string,
  type: ToastType = "success",
): void => {
  usePollingToastStore.getState().addToast(message, type);
};
