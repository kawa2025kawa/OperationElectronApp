// src/renderer/components/ui/toast/toastStore.ts

import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: ToastData[];

  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const TOAST_DURATION = 10_000;

const createToastId = (): string =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type = "success") => {
    const id = createToastId();

    set((state) => ({
      toasts: [
        {
          id,
          message,
          type,
        },
        ...state.toasts,
      ],
    }));

    if (type === "error") {
      return;
    }

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, TOAST_DURATION);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));
