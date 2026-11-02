// src/renderer/store/selectors/operationSelectors.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationViewItem,
  type SelectedOperationItem,
} from "@shared/types/operation/operationTypes";
import {
  isErrorStatus,
  isReadyStatus,
  isRunningStatus,
  isSuccessStatus,
  isWaitingStatus,
} from "@shared/utils/statusUtils";

/**
 * Operationテーブルの検索対象。
 * operationViewConfig.ts とテーブル検索処理で共通利用する。
 */
export const OPERATION_TABLE_SEARCH_KEYS = [
  "kanriNo",
  "workName",
  "jobId",
  "comment",
] as const;

// 指定された検索対象に検索文字列が含まれるか判定する。
function matchesSearchTerm(
  row: OperationViewItem,
  normalizedTerm: string,
  searchKeys: readonly string[],
): boolean {
  const values = row as unknown as Record<string, unknown>;

  return searchKeys.some((key) => {
    const value = values[key];

    return (
      typeof value === "string" && value.toLowerCase().includes(normalizedTerm)
    );
  });
}

// 検索キーワードに基づいて運用テーブル行をフィルタリングして返す。
export function selectFilteredTableRows(
  rows: OperationViewItem[] | undefined,
  searchTerm: string,
  searchKeys: readonly string[] = OPERATION_TABLE_SEARCH_KEYS,
): OperationViewItem[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return rows;
  }

  return rows.filter((row) =>
    matchesSearchTerm(row, normalizedTerm, searchKeys),
  );
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
    isExecuting: isRunningStatus(status),
    isError: isErrorStatus(status),
    isSuccess: isSuccessStatus(status),
    isWaiting: isWaitingStatus(status),
    isReady: isReadyStatus(status),
  };
}
