// src/renderer/hooks/useStatusToast.ts

import { useEffect, useRef } from "react";

import { commands } from "@shared/api/commands";
import { useAppStore } from "@shared/store/index";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";
import { showToast, type ToastType } from "@shared/utils/toastUtils";

import type { JobStatus } from "@shared/types/operationType";

type PendingToast = {
  kanriNo: string;
  status: JobStatus;
  displayName: string;
};

const BATCH_DELAY = 500;
const INITIAL_LOOP_DELAY = 5000;

const TARGET_STATUSES: JobStatus[] = ["success", "ready", "error"];

const prevStatusMap = new Map<string, JobStatus>();

export const useStatusToast = (): void => {
  const isPolling = useAppStore((state) => state.isPolling);

  const pendingRef = useRef<PendingToast[]>([]);
  const timerRef = useRef<number | null>(null);
  const isFirstLoopRef = useRef(true);

  useEffect(() => {
    if (!isPolling) {
      isFirstLoopRef.current = true;
      prevStatusMap.clear();

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      pendingRef.current = [];

      return;
    }

    let cleanup: (() => void) | undefined;

    const firstLoopTimer = window.setTimeout(() => {
      isFirstLoopRef.current = false;
    }, INITIAL_LOOP_DELAY);

    try {
      cleanup = commands.onOperationStatusUpdated((update) => {
        const kanriNo = String(update.kanriNo ?? "");

        if (!kanriNo) {
          return;
        }

        const currentStatus = update.status as JobStatus | undefined;

        if (!currentStatus) {
          return;
        }

        const previousStatus = prevStatusMap.get(kanriNo);

        if (currentStatus === previousStatus) {
          return;
        }

        prevStatusMap.set(kanriNo, currentStatus);

        if (isFirstLoopRef.current) {
          return;
        }

        if (!TARGET_STATUSES.includes(currentStatus)) {
          return;
        }

        /**
         * Enterによる完了処理で発生したSUCCESSは通知しない。
         *
         * ERRORはここでは抑制しない。
         */
        if (
          currentStatus === "success" &&
          consumeSuppressedSuccessToast(kanriNo)
        ) {
          return;
        }

        const state = useAppStore.getState();

        const item =
          state.operationEntities[kanriNo] ?? state.irregularEntities[kanriNo];

        pendingRef.current.push({
          kanriNo,
          status: currentStatus,
          displayName: item?.workName ?? "",
        });

        if (timerRef.current !== null) {
          return;
        }

        timerRef.current = window.setTimeout(() => {
          flush(pendingRef.current);

          pendingRef.current = [];
          timerRef.current = null;
        }, BATCH_DELAY);
      });
    } catch (error) {
      console.error("[Toast] Failed to setup status toast listener:", error);
    }

    return () => {
      cleanup?.();

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      window.clearTimeout(firstLoopTimer);
    };
  }, [isPolling]);
};

const getToastType = (status: JobStatus): ToastType => {
  switch (status) {
    case "error":
      return "error";

    case "success":
      return "success";

    case "ready":
    default:
      return "info";
  }
};

const flush = (list: PendingToast[]): void => {
  if (list.length === 0) {
    return;
  }

  if (list.length === 1) {
    const [toast] = list;

    if (!toast) {
      return;
    }

    const message = `${toast.kanriNo}.${toast.displayName}  ${toast.status}`;

    showToast(message, getToastType(toast.status));

    return;
  }

  const hasError = list.some((toast) => toast.status === "error");

  const first = list[0];

  if (!first) {
    return;
  }

  const message = `${first.kanriNo}.${first.displayName} 他${
    list.length - 1
  }件`;

  showToast(message, hasError ? "error" : "success");
};
