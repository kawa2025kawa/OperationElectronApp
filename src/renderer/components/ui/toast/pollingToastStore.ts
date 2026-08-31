// src/renderer/components/ui/toast/pollingToastStore.ts

import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface PollingToastStore {
  toasts: ToastData[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const TOAST_DURATION = 10_000;

const createToastId = (): string =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const usePollingToastStore = create<PollingToastStore>((set) => ({
  toasts: [],

  addToast: (message, type = "success") => {
    const id = createToastId();

    set((state) => ({
      toasts: [{ id, message, type }, ...state.toasts],
    }));

    if (type === "error") return;

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, TOAST_DURATION);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAllToasts: () => set({ toasts: [] }),
}));
