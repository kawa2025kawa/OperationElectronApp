// src/renderer/components/ui/toast/statusToastHandler.ts

import {
  JOB_STATUS,
  WORK_TYPE,
  type JobStatus,
  type OperationStatusState,
  type OperationViewItem,
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
