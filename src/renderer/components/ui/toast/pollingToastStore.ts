// src/renderer/components/ui/toast/pollingToastStore.ts

import { create } from "zustand";
import type { JobStatus } from "@shared/types/operation/operationTypes";

export type ToastType = "error" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface PollingToastState {
  toasts: ToastMessage[];
  prevStatusMap: Map<string, JobStatus>;
  manualExecutingKanriNos: Set<string>;
  pollingCycle: number;

  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;

  getPrevStatus: (kanriNo: string) => JobStatus | undefined;
  setPrevStatus: (kanriNo: string, status: JobStatus) => void;

  addManualExecuting: (kanriNo: string) => void;
  removeManualExecuting: (kanriNo: string) => void;
  isManualExecuting: (kanriNo: string) => boolean;

  markPollingCycleCompleted: () => void;
  resetToastState: () => void;
}

export const usePollingToastStore = create<PollingToastState>()((set, get) => ({
  toasts: [],
  prevStatusMap: new Map<string, JobStatus>(),
  manualExecutingKanriNos: new Set<string>(),
  pollingCycle: 0,

  addToast: (message, type) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  getPrevStatus: (kanriNo) => {
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

  addManualExecuting: (kanriNo) => {
    set((state) => {
      const nextSet = new Set(state.manualExecutingKanriNos);
      nextSet.add(kanriNo);
      return { manualExecutingKanriNos: nextSet };
    });
  },

  removeManualExecuting: (kanriNo) => {
    set((state) => {
      const nextSet = new Set(state.manualExecutingKanriNos);
      nextSet.delete(kanriNo);
      return { manualExecutingKanriNos: nextSet };
    });
  },

  isManualExecuting: (kanriNo) => {
    return get().manualExecutingKanriNos.has(kanriNo);
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
      manualExecutingKanriNos: new Set<string>(),
      pollingCycle: 0,
    });
  },
}));
