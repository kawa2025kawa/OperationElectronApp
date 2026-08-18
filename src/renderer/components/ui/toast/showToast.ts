// src/renderer/components/ui/toast/showToast.ts
// src/renderer/components/ui/toast/showToast.ts

import { useToastStore, type ToastType } from "./toastStore";

export const showToast = (
  message: string,
  type: ToastType = "success",
  duration = 4000,
) => {
  useToastStore.getState().addToast(message, type, duration);
};
