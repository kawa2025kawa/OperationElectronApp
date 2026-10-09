// src/renderer/components/ui/toast/pollingToastStore.ts

import { create } from "zustand";
import type { JobStatus } from "@shared/types/operation/operationTypes";

export type ToastType = "info" | "success" | "error" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface PollingToastState {
  toasts: ToastMessage[];
  prevStatusMap: Map<string, JobStatus>;
  pollingCycle: number;

  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;

  getPrevStatus: (kanriNo: string) => JobStatus | undefined;
  setPrevStatus: (kanriNo: string, status: JobStatus) => void;

  markPollingCycleCompleted: () => void;
  resetToastState: () => void;
}

const AUTO_CLOSE_DELAY_MS = 10_000;

export const usePollingToastStore = create<PollingToastState>()((set, get) => ({
  toasts: [],
  prevStatusMap: new Map<string, JobStatus>(),
  pollingCycle: 0,

  addToast: (message, type) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          message,
          type,
          createdAt: Date.now(),
        },
      ],
    }));

    if (type === "error") {
      return;
    }

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, AUTO_CLOSE_DELAY_MS);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  getPrevStatus: (kanriNo): JobStatus | undefined => {
    return get().prevStatusMap.get(kanriNo);
  },

  setPrevStatus: (kanriNo, status) => {
    set((state) => {
      const nextMap = new Map(state.prevStatusMap);
      nextMap.set(kanriNo, status);

      return {
        prevStatusMap: nextMap,
      };
    });
  },

  markPollingCycleCompleted: () => {
    set((state) => ({
      pollingCycle: state.pollingCycle + 1,
    }));
  },

  resetToastState: () => {
    set({
      toasts: [],
      prevStatusMap: new Map<string, JobStatus>(),
      pollingCycle: 0,
    });
  },
}));
