// src/renderer/components/ui/toast/statusToastHandler.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { useAppStore } from "@renderer/store";
import { usePollingToastStore, type ToastType } from "./pollingToastStore";

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

function resolveWorkName(kanriNo: string): string {
  const state = useAppStore.getState();

  const allRows = [
    ...state.tableRows,
    ...state.tableRowsByMode.operation,
    ...state.tableRowsByMode.irregular,
    ...state.tableRowsByMode.today,
  ];

  const matched = allRows.find((row) => row.kanriNo?.trim() === kanriNo);
  return matched?.workName?.trim() ?? "";
}

export function handleStatusToastNotification(
  update: OperationStatusState,
): void {
  const kanriNo = update.kanriNo?.trim();
  const { status } = update;
  if (!kanriNo || !status) return;

  if (!useAppStore.getState().isPolling) return;

  const toastStore = usePollingToastStore.getState();
  const prevStatus = toastStore.getPrevStatus(kanriNo);

  if (prevStatus === status) return;

  toastStore.setPrevStatus(kanriNo, status);

  const toastType = mapStatusToToastType(status);
  if (!toastType) return;

  const workName = resolveWorkName(kanriNo);
  const message = workName ? `${kanriNo} : ${workName}` : kanriNo;

  toastStore.addToast(message, toastType);
}
