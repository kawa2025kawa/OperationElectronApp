// src/renderer/store/selectors/operationSelectors.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationViewItem,
  type SelectedOperationItem,
} from "@shared/types/operation/operationTypes";

// 行データ（管理No、業務名、ジョブID、備考）に検索文字列が含まれるか判定する。
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

// 検索キーワードに基づいて運用テーブル行をフィルタリングして返す。
export function selectFilteredTableRows(
  rows: OperationViewItem[] | undefined,
  searchTerm: string,
): OperationViewItem[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return rows;
  }

  return rows.filter((row) => matchesSearchTerm(row, normalizedTerm));
}

export interface ActiveItemStatusFlags {
  item: SelectedOperationItem | undefined;
  status: JobStatus;
  isExecuting: boolean;
  isError: boolean;
  isSuccess: boolean;
  isWaiting: boolean;
  isReady: boolean;
}

// 選択中の運用アイテムを取得し、実行状態に応じた各種ステータスフラグを判定して返す。
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
