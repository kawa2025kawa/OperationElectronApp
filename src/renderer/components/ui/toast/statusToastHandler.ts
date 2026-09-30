// src/renderer/components/ui/toast/statusToastHandler.ts

import { getAutoScriptKeys } from "@electron/features/operation/config/operationScriptRegistry";
import { findMasterByKanriNo } from "@renderer/features/operation/helpers/entityUtils";
import { useAppStore } from "@renderer/store/index";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";

import { usePollingToastStore, type ToastType } from "./pollingToastStore";

const TOAST_TYPE_MAP: Partial<Record<JobStatus, ToastType>> = {
  [JOB_STATUS.ERROR]: "error",
  [JOB_STATUS.SUCCESS]: "success",
  [JOB_STATUS.READY]: "info",
};

const isAutoNotificationTarget = (
  kanriNo: string,
  master?: object,
): boolean => {
  const jobId =
    master && "jobId" in master && typeof master.jobId === "string"
      ? master.jobId
      : undefined;

  const hasJob = Boolean(
    jobId && jobId.trim() !== "-" && jobId.trim() !== "ー",
  );

  const hasAutoScript = getAutoScriptKeys(kanriNo).length > 0;

  return hasJob || hasAutoScript;
};

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
  const isFirstPollingCycle = toastStore.pollingCycle === 0;

  if (status === toastStore.getPrevStatus(kanriNo)) {
    return;
  }

  toastStore.setPrevStatus(kanriNo, status);

  if (isFirstPollingCycle) {
    return;
  }

  const toastType = TOAST_TYPE_MAP[status];

  if (!toastType) {
    return;
  }

  if (status === JOB_STATUS.SUCCESS && consumeSuppressedSuccessToast(kanriNo)) {
    return;
  }

  const master = findMasterByKanriNo(state, kanriNo);

  if (!master || !isAutoNotificationTarget(kanriNo, master)) {
    return;
  }

  const nameLabel =
    master.workName ||
    ("jobId" in master && master.jobId && master.jobId !== "-"
      ? String(master.jobId)
      : null) ||
    `No.${kanriNo}`;

  toastStore.addToast(`${nameLabel} ${status}`, toastType);
};
