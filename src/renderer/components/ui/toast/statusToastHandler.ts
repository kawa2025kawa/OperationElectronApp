// src/renderer/components/ui/toast/statusToastHandler.ts

import { useAppStore } from "@renderer/store/index";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";

import { usePollingToastStore, type ToastType } from "./pollingToastStore";

const TOAST_TYPE_MAP: Readonly<Partial<Record<JobStatus, ToastType>>> = {
  [JOB_STATUS.ERROR]: "error",
  [JOB_STATUS.SUCCESS]: "success",
  [JOB_STATUS.READY]: "info",
};

function isAutoNotificationTarget(kanriNo: string): boolean {
  return Boolean(kanriNo);
}

export const handleStatusToastNotification = (
  update: OperationStatusState,
  options?: { isManual?: boolean },
): void => {
  const state = useAppStore.getState();

  if (options?.isManual || !state.isPolling) {
    return;
  }

  const { kanriNo, status } = update;
  if (!kanriNo || !status) {
    return;
  }

  const toastStore = usePollingToastStore.getState();

  if (status === toastStore.getPrevStatus(kanriNo)) {
    return;
  }

  toastStore.setPrevStatus(kanriNo, status);

  if (toastStore.pollingCycle === 0) {
    return;
  }

  const toastType = TOAST_TYPE_MAP[status];
  if (!toastType) {
    return;
  }

  if (status === JOB_STATUS.SUCCESS && consumeSuppressedSuccessToast(kanriNo)) {
    return;
  }

  if (!isAutoNotificationTarget(kanriNo)) {
    return;
  }

  const nameLabel = `No.${kanriNo}`;

  toastStore.addToast(`${nameLabel} ${status}`, toastType);
};
