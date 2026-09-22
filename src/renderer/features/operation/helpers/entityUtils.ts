// src/renderer/features/operation/helpers/entityUtils.ts

import type { AppState } from "@renderer/store";
import {
  EMPTY_STATUS_SUMMARY,
  StatusOrder,
  type JobStatus,
  type OperationItem,
  type StatusSummary,
} from "@shared/types/operation/operationTypes";

type EntityCollection = Record<string, OperationItem> | OperationItem[];

export const INITIAL_SUMMARY: StatusSummary = {
  ...EMPTY_STATUS_SUMMARY,
};

export const MANUAL_ALIAS_MAP: Readonly<Record<string, string>> = {
  "37": "30",
  "45": "30",
  "48": "30",
  "54": "30",
  "36": "29",
  "44": "29",
  "47": "29",
  "43": "28",
  "68": "28",
};

// 🎯 StatusOrder.ORDER から Valid Status の Set を作成
const VALID_STATUSES = new Set<JobStatus>(StatusOrder.ORDER);

export function getManualUrl(kanriNo: string | number): string {
  const normalizedKanriNo = String(kanriNo).trim();
  const targetKanriNo =
    MANUAL_ALIAS_MAP[normalizedKanriNo] ?? normalizedKanriNo;

  return `https://sites.google.com/belc.co.jp/operation-manual-${targetKanriNo}`;
}

export function hasValidJobId(item: OperationItem): boolean {
  if (!("jobId" in item) || !item.jobId) return false;
  return item.jobId !== "-";
}

export function mapRawEntities(
  items: EntityCollection,
): Record<string, OperationItem> {
  const source = Array.isArray(items) ? items : Object.values(items);

  return source.reduce<Record<string, OperationItem>>((entities, item) => {
    if (!item) return entities;
    const kanriNo = String(item.kanriNo).trim();
    if (!kanriNo) return entities;

    entities[kanriNo] = { ...item } as OperationItem;
    return entities;
  }, {});
}

export function calculateSummary(
  input: EntityCollection,
  _options?: Record<string, boolean>,
): StatusSummary {
  const items = Array.isArray(input) ? input : Object.values(input);

  const summary: StatusSummary = {
    ...INITIAL_SUMMARY,
    total: items.length,
  };

  for (const item of items) {
    if (!item?.status) continue;

    // 🎯 すでに JobStatus へ正規化済み前提のため直接判定
    const { status } = item;
    if (VALID_STATUSES.has(status)) {
      summary[status] += 1;
    }
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;

  return summary;
}

export function getAllEntitiesMap(
  state: Pick<AppState, "operationEntities" | "irregularEntities">,
): Record<string, OperationItem> {
  return {
    ...state.operationEntities,
    ...state.irregularEntities,
  };
}

export function getAllEntitiesArray(
  state: Pick<AppState, "operationEntities" | "irregularEntities" | "todayIds">,
): OperationItem[] {
  const operations = Object.values(state.operationEntities);
  const todayIds = new Set(state.todayIds.map((id) => String(id)));

  const todayIrregulars = Object.values(state.irregularEntities).filter(
    (item) => todayIds.has(String(item.kanriNo)),
  );

  return [...operations, ...todayIrregulars];
}

/**
 * 🎯 ステータス評価・操作対象（Operation全件 + todayIdsに一致するIrregular）のみをマップで抽出
 */
export function getActiveStatusEntitiesMap(
  state: Pick<AppState, "operationEntities" | "irregularEntities" | "todayIds">,
): Record<string, OperationItem> {
  const items = getAllEntitiesArray(state);
  return mapRawEntities(items);
}

export function findEntityByKanriNo(
  state: Pick<AppState, "operationEntities" | "irregularEntities">,
  kanriNo: string | number,
): OperationItem | undefined {
  const key = String(kanriNo).trim();
  return state.operationEntities[key] ?? state.irregularEntities[key];
}
