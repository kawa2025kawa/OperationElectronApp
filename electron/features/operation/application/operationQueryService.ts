// electron/features/operation/application/operationQueryService.ts

import { isRunningStatus } from "@electron/features/operation/domain/statusRules";
import { statusStore } from "./statusStore";
import {
  EMPTY_STATUS_SUMMARY,
  type StatusSummary,
  type SummaryDetailRow,
} from "@shared/types/statusSummary/statusSummaryTypes";
import type {
  JobStatus,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

/**
 * ステータスサマリーの件数および進捗率を取得する。
 */
export function getStatusSummary(): StatusSummary {
  const summary: StatusSummary = {
    ...EMPTY_STATUS_SUMMARY,
    total: statusStore.targets.size,
  };

  for (const [kanriNo] of statusStore.targets) {
    const status = statusStore.statuses.get(kanriNo)?.status;

    if (!status || !(status in summary)) {
      continue;
    }

    summary[status] += 1;
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  return summary;
}

/**
 * サマリーモーダル用の詳細一覧を取得する。
 */
export function getSummaryDetails(filterKey: string): SummaryDetailRow[] {
  const normalizedFilter = filterKey.trim().toLowerCase();
  const results: SummaryDetailRow[] = [];

  for (const [, target] of statusStore.targets) {
    const statusState = statusStore.statuses.get(target.kanriNo);
    const currentStatus = statusState?.status;

    if (!matchesSummaryFilter(normalizedFilter, currentStatus)) {
      continue;
    }

    const row: SummaryDetailRow = {
      kanriNo: target.kanriNo,
      workName: target.workName || `No.${target.kanriNo}`,
      status: currentStatus,
      comment: statusState?.comment ?? undefined,
    };

    if ("jobId" in target && target.jobId !== undefined) {
      row.jobId = String(target.jobId);
    }

    results.push(row);
  }

  return results;
}

/**
 * サマリーの絞り込み条件を判定する。
 */
function matchesSummaryFilter(
  normalizedFilter: string,
  status: JobStatus | undefined,
): boolean {
  if (normalizedFilter === "total") {
    return true;
  }

  if (normalizedFilter === "progress") {
    return isRunningStatus(status);
  }

  return Boolean(status && status.toLowerCase() === normalizedFilter);
}

/**
 * モード別テーブル表示用データを取得する。
 *
 * OperationTableRowData を新規定義せず、
 * 既存の OperationViewItem とステータス情報を使って組み立てる。
 */
export function getOperationTableData(
  mode: "operation" | "irregular" | "today",
): OperationViewItem[] {
  switch (mode) {
    case "operation":
      return getStatusTargetItems("operation");

    case "today":
      return getStatusTargetItems("today");

    case "irregular":
      return getIrregularItems();
  }
}

/**
 * 通常作業・当日作業のマスターを取得する。
 * マスターに存在しない任意項目は追加しない。
 */
function getStatusTargetItems(
  targetType: "operation" | "today",
): OperationViewItem[] {
  const results: OperationViewItem[] = [];

  for (const [, target] of statusStore.targets) {
    if (target.targetType !== targetType) {
      continue;
    }

    const statusState = statusStore.statuses.get(target.kanriNo);

    const item = {
      ...target,
      ...(statusState?.status !== undefined
        ? { status: statusState.status }
        : {}),
      ...(statusState?.comment !== undefined
        ? { comment: statusState.comment }
        : {}),
      ...(statusState?.startTime !== undefined
        ? { startTime: statusState.startTime }
        : {}),
      ...(statusState?.endTime !== undefined
        ? { endTime: statusState.endTime }
        : {}),
    } as OperationViewItem;

    results.push(item);
  }

  return results;
}

/**
 * 不定期作業のマスター一覧を取得する。
 */
function getIrregularItems(): OperationViewItem[] {
  return statusStore.dependencyMasters.irregularMasters;
}
