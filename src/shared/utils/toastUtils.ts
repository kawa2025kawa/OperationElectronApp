// src/shared/utils/toastUtils.ts
import React from "react";
import { toast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

export const showToast = (message: string, type: ToastType = "info", duration = 10000) => {
  const toastDuration = type === "error" ? Infinity : duration;
  toast(message, { duration: toastDuration });
};

export const showErrorToast = (error: unknown, prefix?: string) => {
  const message = error instanceof Error ? error.message : String(error);
  const finalMessage = prefix ? `${prefix}: ${message}` : message;
  showToast(finalMessage, "error");
};