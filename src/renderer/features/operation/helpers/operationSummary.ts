// src/renderer/features/operation/helpers/operationSummary.ts
import type { StatusSummary } from "@shared/types/uiType";
import { EMPTY_STATUS_SUMMARY, STATUS_ORDER } from "@shared/types/uiType";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import type { AppState } from "@shared/store";
import { calculateNextStatus } from "./statusEvaluator";

export const INITIAL_SUMMARY: StatusSummary = { ...EMPTY_STATUS_SUMMARY };
const VALID_STATUSES = new Set<string>(STATUS_ORDER);

/**
 * 有効な jobId を保持しているか判定 ("-" や 空文字を除外)
 */
export const hasValidJobId = (item: OperationItem): boolean => {
  return Boolean("jobId" in item && item.jobId && item.jobId !== "-");
};

/**
 * jobId を持つジョブの集計結果インターフェース
 */
export interface JobIdSummary {
  total: number;
  successCount: number;
  allCompleted: boolean;
}

/**
 * jobId を持つ有効なデータのトータル件数・Status状況を集計
 */
export function calculateJobIdSummary(items: OperationItem[]): JobIdSummary {
  const jobIdItems = items.filter(hasValidJobId);
  const total = jobIdItems.length;

  if (total === 0) {
    return { total: 0, successCount: 0, allCompleted: true };
  }

  const successCount = jobIdItems.filter(
    (item) => String(item.status).toLowerCase() === "success",
  ).length;

  return {
    total,
    successCount,
    allCompleted: successCount === total,
  };
}

/**
 * OperationItem 配列またはオブジェクトを kanriNo キーのマップに変換
 */
export const mapRawEntities = (
  items: OperationItem[] | Record<string, OperationItem>,
): Record<string, OperationItem> => {
  const list = Array.isArray(items) ? items : Object.values(items ?? {});
  const entities: Record<string, OperationItem> = {};
  for (const item of list) {
    if (!item) continue;
    const kanriNo = String(item.kanriNo).trim();
    if (kanriNo) entities[kanriNo] = item;
  }
  return entities;
};

/**
 * AppState から Operation および本日対象の Irregular エントリを一括取得
 */
export function getAllEntities(state: AppState): OperationItem[] {
  const ops = Object.values(state.operationEntities ?? {});
  const todayIdsSet = new Set(state.todayIds ?? []);
  const todayIrregulars = Object.values(state.irregularEntities ?? {}).filter(
    (item) => todayIdsSet.has(String(item.kanriNo)),
  );
  return [...ops, ...todayIrregulars];
}

/**
 * 全体サマリーの計算
 */
export function calculateSummary(
  input: Record<string, OperationItem> | OperationItem[],
  activeFlags?: Record<string, boolean>,
): StatusSummary {
  const items = Array.isArray(input) ? input : Object.values(input ?? {});
  const allEntitiesMap = mapRawEntities(items);
  const summary: StatusSummary = {
    ...INITIAL_SUMMARY,
    total: items.length,
  };

  for (const item of items) {
    if (!item) continue;
    const rawStatus = item.status
      ? (String(item.status).toLowerCase() as JobStatus)
      : undefined;
    const computedStatus = calculateNextStatus(
      item,
      rawStatus,
      allEntitiesMap,
      activeFlags,
    );
    const statusKey = computedStatus as JobStatus;
    if (VALID_STATUSES.has(statusKey)) {
      summary[statusKey] = (summary[statusKey] ?? 0) + 1;
    }
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  return summary;
}
