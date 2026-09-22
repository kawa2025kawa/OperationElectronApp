// src/renderer/components/ui/toast/statusToastHandler.ts

import { useAppStore } from "@renderer/store/index";
import { consumeSuppressedSuccessToast } from "@shared/utils/statusToastSuppression";
import { usePollingToastStore, type ToastType } from "./pollingToastStore";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation/operationTypes";

/* ============================================================================
 * Constants & Helpers
 * ========================================================================== */

const TOAST_TYPE_MAP: Partial<Record<JobStatus, ToastType>> = {
  [JOB_STATUS.ERROR]: "error",
  [JOB_STATUS.SUCCESS]: "success",
  [JOB_STATUS.READY]: "info",
};

function isAutoNotificationTarget(item: OperationItem): boolean {
  return item.executionType !== "manual";
}

/* ============================================================================
 * Handler Implementation
 * ========================================================================== */

export const handleStatusToastNotification = (
  update: OperationItem,
  options?: { isManual?: boolean },
): void => {
  const state = useAppStore.getState();
  if (options?.isManual || !state.isPolling) return;

  const kanriNo = update?.kanriNo ? String(update.kanriNo) : null;
  const currentStatus = update?.status;
  if (!kanriNo || !currentStatus) return;

  const toastStore = usePollingToastStore.getState();

  // 直前と同じステータスの場合は通知スキップ
  if (currentStatus === toastStore.getPrevStatus(kanriNo)) return;
  toastStore.setPrevStatus(kanriNo, currentStatus);

  const toastType = TOAST_TYPE_MAP[currentStatus];
  if (!toastType) return;

  // 手動完了時などのトースト抑制チェック
  if (
    currentStatus === JOB_STATUS.SUCCESS &&
    consumeSuppressedSuccessToast(kanriNo)
  ) {
    return;
  }

  const item = state.getEntityByKanriNo
    ? state.getEntityByKanriNo(kanriNo)
    : (state.operationEntities[kanriNo] ??
      state.irregularEntities[kanriNo] ??
      update);

  if (!item || !isAutoNotificationTarget(item)) return;

  const nameLabel =
    item.workName ||
    update.workName ||
    ("jobId" in update && update.jobId ? String(update.jobId) : null) ||
    `No.${kanriNo}`;

  toastStore.addToast(`${nameLabel} ${currentStatus}`, toastType);
};
