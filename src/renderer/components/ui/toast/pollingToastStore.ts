import { create } from "zustand";
import { useAppStore } from "@shared/store";

export type ToastType = "success" | "error" | "info" | "warning";

interface AddToastOptions {
  type?: ToastType;
  /** 自動監視対象のデータ通知かどうか */
  isAutoMonitored?: boolean;
}

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface PollingToastStore {
  toasts: ToastData[];

  addToast: (message: string, options?: ToastType | AddToastOptions) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const TOAST_DURATION = 10_000;

const createToastId = (): string =>
  `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const usePollingToastStore = create<PollingToastStore>((set) => ({
  toasts: [],

  addToast: (message, options = "success") => {
    const isPolling = useAppStore.getState().isPolling;

    // Guard: polling が OFF の場合は一切通知を出さない
    if (!isPolling) {
      return;
    }

    const opts: AddToastOptions =
      typeof options === "string" ? { type: options } : options;

    // Guard: 自動監視対象外が明示指定されている場合はスキップ
    if (opts.isAutoMonitored === false) {
      return;
    }

    const type = opts.type ?? "success";
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
