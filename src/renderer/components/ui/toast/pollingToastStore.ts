// src/renderer/components/ui/toast/pollingToastStore.ts

import { create } from "zustand";
import type { JobStatus } from "@shared/types/operation";

export type ToastType = "info" | "success" | "error" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface PollingToastState {
  toasts: ToastMessage[];
  prevStatusMap: Map<string, JobStatus>;
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  getPrevStatus: (kanriNo: string) => JobStatus | undefined;
  setPrevStatus: (kanriNo: string, status: JobStatus) => void;
  resetToastState: () => void;
}

export const usePollingToastStore = create<PollingToastState>()((set, get) => ({
  toasts: [],
  prevStatusMap: new Map<string, JobStatus>(),

  addToast: (message, type) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, createdAt: Date.now() }],
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

  getPrevStatus: (kanriNo) => {
    return get().prevStatusMap.get(kanriNo);
  },

  setPrevStatus: (kanriNo, status) => {
    set((state) => {
      const nextMap = new Map(state.prevStatusMap);
      nextMap.set(kanriNo, status);
      return { prevStatusMap: nextMap };
    });
  },

  resetToastState: () => {
    set({ toasts: [], prevStatusMap: new Map() });
  },
}));
