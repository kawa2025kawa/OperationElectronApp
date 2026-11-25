// src/renderer/components/ui/toast/pollingToastStore.ts

import { create } from "zustand";
import { useAppStore } from "@renderer/store";
import {
  JOB_STATUS,
  WORK_TYPE,
  type JobStatus,
  type OperationStatusState,
  type OperationViewItem,
} from "@shared/types/operation/operationTypes";

type ToastType = "error" | "warning";

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

  getPrevStatus: (kanriNo) => get().prevStatusMap.get(kanriNo),

  setPrevStatus: (kanriNo, status) => {
    set((state) => {
      const nextMap = new Map(state.prevStatusMap);
      nextMap.set(kanriNo, status);
      return { prevStatusMap: nextMap };
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

  isManualExecuting: (kanriNo) => get().manualExecutingKanriNos.has(kanriNo),

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

function mapStatusToToastType(status: JobStatus): ToastType | null {
  switch (status) {
    case JOB_STATUS.ERROR:
      return "error";
    case JOB_STATUS.NEEDS_ACTION:
      return "warning";
    default:
      return null;
  }
}

function findOperationRow(kanriNo: string): OperationViewItem | undefined {
  const state = useAppStore.getState();
  const allRows = [
    ...state.tableRows,
    ...state.tableRowsByMode.operation,
    ...state.tableRowsByMode.irregular,
    ...state.tableRowsByMode.today,
  ];
  return allRows.find((row) => row.kanriNo?.trim() === kanriNo);
}

export function handleStatusToastNotification(
  update: OperationStatusState,
): void {
  const kanriNo = update.kanriNo?.trim();
  const { status } = update;
  if (!kanriNo || !status) return;

  if (!useAppStore.getState().isPolling) return;

  const toastStore = usePollingToastStore.getState();
  if (toastStore.isManualExecuting(kanriNo)) return;

  const row = findOperationRow(kanriNo);
  if (row?.workType?.trim() !== WORK_TYPE.AUTO) return;

  const prevStatus = toastStore.getPrevStatus(kanriNo);
  if (prevStatus === status) return;

  toastStore.setPrevStatus(kanriNo, status);

  const toastType = mapStatusToToastType(status);
  if (!toastType) return;

  const workName = row.workName?.trim() ?? "";
  const message = workName ? `${kanriNo} : ${workName}` : kanriNo;

  toastStore.addToast(message, toastType);
}
