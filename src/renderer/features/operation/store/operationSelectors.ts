// src/renderer/features/operation/store/operationSelectors.ts

import type { AppState } from "@renderer/store";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationViewItem,
  type SelectedOperationItem,
} from "@shared/types/operation/operationTypes";

/* =========================
 * Basic Selectors
 * ========================= */

export const selectCurrentMode = (state: AppState) => state.currentMode;

/* =========================
 * Search Filtering
 * ========================= */

function matchesSearchTerm(
  row: OperationViewItem,
  normalizedTerm: string,
): boolean {
  return (
    row.kanriNo.toLowerCase().includes(normalizedTerm) ||
    row.workName.toLowerCase().includes(normalizedTerm) ||
    ("jobId" in row &&
      typeof row.jobId === "string" &&
      row.jobId.toLowerCase().includes(normalizedTerm)) ||
    ("comment" in row &&
      typeof row.comment === "string" &&
      row.comment.toLowerCase().includes(normalizedTerm))
  );
}

export function selectFilteredTableRows(
  rows: OperationViewItem[],
  searchTerm: string,
): OperationViewItem[] {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return rows;
  }

  return rows.filter((row) => matchesSearchTerm(row, normalizedTerm));
}

/* =========================
 * Active Item Status Flags
 * ========================= */

export interface ActiveItemStatusFlags {
  item: SelectedOperationItem | undefined;
  status: JobStatus;
  isExecuting: boolean;
  isError: boolean;
  isSuccess: boolean;
  isWaiting: boolean;
  isReady: boolean;
}

/**
 * 選択中のアイテムと、そのステータスフラグを取得する
 */
export function selectActiveItemStatusFlags(
  rows: SelectedOperationItem[],
  selectedId: string,
): ActiveItemStatusFlags {
  const item = selectedId
    ? rows.find((row) => row.kanriNo === selectedId)
    : undefined;

  const status = item?.status ?? JOB_STATUS.SCHEDULED;

  return {
    item,
    status,
    isExecuting:
      status === JOB_STATUS.RUNNING || status === JOB_STATUS.SCRIPT_RUNNING,
    isError: status === JOB_STATUS.ERROR,
    isSuccess: status === JOB_STATUS.SUCCESS,
    isWaiting: status === JOB_STATUS.WAITING,
    isReady: status === JOB_STATUS.READY,
  };
}
