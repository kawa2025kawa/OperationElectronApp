// src/renderer/features/operation/helpers/operationEntities.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation";
import {
  EMPTY_STATUS_SUMMARY,
  STATUS_ORDER,
  type StatusSummary,
} from "@shared/types/ui";
import { isIrregularToday } from "@shared/utils/isIrregularToday";
import type { AppState } from "@renderer/store";

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

const VALID_STATUSES = new Set<JobStatus>(STATUS_ORDER);
const MIN_GLOBAL_PROCESSING_DISPLAY_TIME_MS = 3000;

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

  // 🎯 今日の全対象アイテムを正確に集計
  const summary: StatusSummary = {
    ...INITIAL_SUMMARY,
    total: items.length,
  };

  for (const item of items) {
    if (!item?.status) continue;
    const status = item.status.toLowerCase() as JobStatus;
    if (!VALID_STATUSES.has(status)) continue;
    summary[status] += 1;
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

export function findEntityByKanriNo(
  state: Pick<AppState, "operationEntities" | "irregularEntities">,
  kanriNo: string | number,
): OperationItem | undefined {
  const key = String(kanriNo).trim();
  return state.operationEntities[key] ?? state.irregularEntities[key];
}

export async function runJobWithGlobalProcessing<T = void>(
  state: AppState,
  message: string,
  target: string,
  executeFn: () => Promise<T>,
): Promise<T> {
  const alreadyProcessing = state.globalProcessing !== null;
  if (!alreadyProcessing) {
    state.setGlobalProcessing({ message, target });
  }
  const startedAt = Date.now();
  try {
    return await executeFn();
  } finally {
    if (!alreadyProcessing) {
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_GLOBAL_PROCESSING_DISPLAY_TIME_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, remaining);
        });
      }
      state.setGlobalProcessing(null);
    }
  }
}

// ------------------------------------------------------------
// Status Factory & Merge Functions
// ------------------------------------------------------------

export function mergeStatus(
  entity: OperationItem,
  update: OperationItem,
): void {
  if (update.status) entity.status = update.status;
  if (update.comment != null) {
    const comment = update.comment.trim();
    if (comment) entity.comment = comment;
  }
  if (update.startTime) entity.startTime = update.startTime.trim();
  if (update.endTime) entity.endTime = update.endTime.trim();
  if (update.expectedStartTime)
    entity.expectedStartTime = update.expectedStartTime.trim();
  if (update.expectedEndTime)
    entity.expectedEndTime = update.expectedEndTime.trim();
  if (update.substatus != null) entity.substatus = update.substatus;
  if (update.info != null) entity.info = update.info;
}

function createBaseStatus(
  kanriNo: string,
  item: OperationItem,
  status: JobStatus,
  comment: string,
): OperationItem {
  return {
    ...item,
    kanriNo,
    status,
    comment,
    startTime: item.startTime?.trim() || null,
    endTime: item.endTime?.trim() || null,
    expectedStartTime: item.expectedStartTime?.trim() || null,
    expectedEndTime: item.expectedEndTime?.trim() || null,
    substatus: item.substatus ?? null,
  };
}

export function createRunningStatus(
  kanriNo: string,
  item: OperationItem,
  comment = "処理中...",
): OperationItem {
  return createBaseStatus(kanriNo, item, JOB_STATUS.RUNNING, comment);
}

export function createErrorStatus(
  kanriNo: string,
  item: OperationItem,
  message: string,
): OperationItem {
  return createBaseStatus(kanriNo, item, JOB_STATUS.ERROR, message);
}

export function createSuccessStatus(
  kanriNo: string,
  item: OperationItem,
  comment: string,
  status: JobStatus = JOB_STATUS.SUCCESS,
): OperationItem {
  return createBaseStatus(kanriNo, item, status, comment);
}

export function buildInitialOperationData(
  operations: OperationItem[],
  irregulars: OperationItem[],
  statuses: Record<string, OperationItem>,
) {
  const operationEntities = mapRawEntities(operations);
  const irregularEntities = mapRawEntities(irregulars);

  for (const [kanriNo, status] of Object.entries(statuses)) {
    if (operationEntities[kanriNo]) {
      mergeStatus(operationEntities[kanriNo], status);
    }
    if (irregularEntities[kanriNo]) {
      mergeStatus(irregularEntities[kanriNo], status);
    }
  }

  return {
    operationIds: operations.map(({ kanriNo }) => String(kanriNo)),
    operationEntities,
    irregularIds: irregulars.map(({ kanriNo }) => String(kanriNo)),
    irregularEntities,
    todayIds: irregulars
      .filter(isIrregularToday)
      .map(({ kanriNo }) => String(kanriNo)),
  };
}
