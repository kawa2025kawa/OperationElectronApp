// src/shared/utils/toastUtils.ts

// src/shared/utils/toastUtils.ts

import { toast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

export const showToast = (
  message: string,
  type: ToastType = "info",
  duration = 10000,
): void => {
  const toastDuration = type === "error" ? Infinity : duration;

  // sonner の各タイプ(toast.error, toast.success等)を呼び出す
  toast[type](message, { duration: toastDuration });
};

export const showErrorToast = (error: unknown, prefix?: string): void => {
  const message = error instanceof Error ? error.message : String(error);
  const finalMessage = prefix ? `${prefix}: ${message}` : message;

  showToast(finalMessage, "error");
};
