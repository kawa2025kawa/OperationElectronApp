// src/renderer/features/operation/helpers/operationSummary.ts

import type { StatusSummary } from "@shared/types/uiType";
import { EMPTY_STATUS_SUMMARY, STATUS_ORDER } from "@shared/types/uiType";
import type { JobStatus, OperationItem } from "@shared/types/operationType";
import type { AppState } from "@shared/store";
import { calculateNextStatus } from "./statusEvaluator";

export const INITIAL_SUMMARY: StatusSummary = { ...EMPTY_STATUS_SUMMARY };

const VALID_STATUSES = new Set<string>(STATUS_ORDER);

/**
 * OperationItem 配列またはオブジェクトから kanriNo をキーにしたマップを作成
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
 * AppState から「通常作業 + 本日分のイレギュラー作業」のみを配列形式で取得
 */
export function getAllEntities(state: AppState): OperationItem[] {
  const ops = Object.values(state.operationEntities ?? {});

  // イレギュラーデータは todayIds に含まれるもの（本日分）のみ抽出
  const todayIdsSet = new Set(state.todayIds ?? []);
  const todayIrregulars = Object.values(state.irregularEntities ?? {}).filter(
    (item) => todayIdsSet.has(String(item.kanriNo)),
  );

  return [...ops, ...todayIrregulars];
}

/**
 * サマリー数値を計算
 * activeFlags（店舗/センター有効フラグ）を考慮して最新の動的ステータスを集計
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

  // 進捗率の計算 (完了数 / 全体数)
  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  return summary;
}
