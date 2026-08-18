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

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type = "success") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastData = { id, message, type };

    set((state) => ({
      toasts: [newToast, ...state.toasts], // 新しい通知を上に追加
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));
