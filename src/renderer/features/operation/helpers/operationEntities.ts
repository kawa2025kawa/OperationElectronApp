// src/renderer/features/operation/helpers/operationEntities.ts

import type { AppState } from "@renderer/store";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";
import {
  EMPTY_STATUS_SUMMARY,
  STATUS_ORDER,
  type StatusSummary,
} from "@shared/types/uiType";
import { isIrregularToday } from "@shared/utils/isIrregularToday";

export const INITIAL_SUMMARY: StatusSummary = { ...EMPTY_STATUS_SUMMARY };
const VALID_STATUSES = new Set<string>(STATUS_ORDER);

export const hasValidJobId = (item: OperationItem): boolean => {
  return Boolean("jobId" in item && item.jobId && item.jobId !== "-");
};

export function getAllEntitiesMap(
  state: Pick<AppState, "operationEntities" | "irregularEntities">,
): Record<string, OperationItem> {
  return { ...state.operationEntities, ...state.irregularEntities };
}

export const getAllEntities = getAllEntitiesMap;

export function getAllEntitiesArray(state: AppState): OperationItem[] {
  const ops = Object.values(state.operationEntities ?? {});
  const todayIdsSet = new Set(state.todayIds ?? []);
  const todayIrregulars = Object.values(state.irregularEntities ?? {}).filter(
    (item) => todayIdsSet.has(String(item.kanriNo)),
  );
  return [...ops, ...todayIrregulars];
}

export function findEntityByKanriNo(
  state: Pick<AppState, "operationEntities" | "irregularEntities">,
  kanriNo: string | number,
): OperationItem | undefined {
  const key = String(kanriNo);
  return state.operationEntities[key] ?? state.irregularEntities[key];
}

export function mapRawEntities(
  items: OperationItem[] | Record<string, OperationItem>,
): Record<string, OperationItem> {
  const list = Array.isArray(items) ? items : Object.values(items ?? {});
  const entities: Record<string, OperationItem> = {};
  for (const item of list) {
    if (!item) continue;
    const kanriNo = String(item.kanriNo).trim();
    if (kanriNo) entities[kanriNo] = item;
  }
  return entities;
}

export function calculateSummary(
  input: Record<string, OperationItem> | OperationItem[],
  _activeFlags?: Record<string, boolean>,
): StatusSummary {
  const items = Array.isArray(input) ? input : Object.values(input ?? {});
  const summary: StatusSummary = {
    ...INITIAL_SUMMARY,
    total: items.length,
  };

  for (const item of items) {
    if (!item) continue;
    const statusKey = (item.status?.toLowerCase() ?? "") as JobStatus;
    if (VALID_STATUSES.has(statusKey)) {
      summary[statusKey] = (summary[statusKey] ?? 0) + 1;
    }
  }

  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;
  return summary;
}

const mergeStr = (
  next?: string | null,
  current?: string | null,
): string | null => next?.trim() || current || null;

export const mergeStatus = (
  entity: OperationItem,
  update: OperationItem,
): void => {
  entity.status = update.status ?? entity.status ?? JOB_STATUS.SCHEDULED;
  if (update.comment != null) {
    const comment = update.comment.trim();
    if (comment) entity.comment = comment;
  }
  entity.startTime = mergeStr(update.startTime, entity.startTime);
  entity.endTime = mergeStr(update.endTime, entity.endTime);
  entity.expectedStartTime = mergeStr(
    update.expectedStartTime,
    entity.expectedStartTime,
  );
  entity.expectedEndTime = mergeStr(
    update.expectedEndTime,
    entity.expectedEndTime,
  );
  if (update.substatus?.length) entity.substatus = update.substatus;
  if (update.info != null) entity.info = update.info;
};

const createBaseStatus = (
  kanriNo: string,
  item: OperationItem,
  status: JobStatus,
  comment: string,
): OperationItem => ({
  ...item,
  kanriNo,
  status,
  comment,
  startTime: item.startTime?.trim() ? item.startTime : null,
  endTime: item.endTime?.trim() ? item.endTime : null,
  expectedStartTime: item.expectedStartTime?.trim()
    ? item.expectedStartTime
    : null,
  expectedEndTime: item.expectedEndTime?.trim() ? item.expectedEndTime : null,
  substatus: item.substatus ?? null,
});

export const createRunningStatus = (
  kanriNo: string,
  item: OperationItem,
  comment = "実行中...",
) => createBaseStatus(kanriNo, item, JOB_STATUS.RUNNING, comment);

export const createErrorStatus = (
  kanriNo: string,
  item: OperationItem,
  message: string,
) => createBaseStatus(kanriNo, item, JOB_STATUS.ERROR, message);

export const createSuccessStatus = (
  kanriNo: string,
  item: OperationItem,
  comment: string,
  status: JobStatus = JOB_STATUS.SUCCESS,
) => createBaseStatus(kanriNo, item, status, comment);

export function resetAllEntityStatuses(state: AppState): void {
  for (const targetKey of ["operationEntities", "irregularEntities"] as const) {
    const targetGroup = state[targetKey];
    for (const [key, entity] of Object.entries(targetGroup)) {
      targetGroup[key] = {
        ...(entity as OperationItem),
        status: JOB_STATUS.SCHEDULED,
        comment: null,
        startTime: null,
        endTime: null,
        expectedStartTime: null,
        expectedEndTime: null,
        substatus: null,
        info: null,
      };
    }
  }
}

export function updateEntityInState(
  state: AppState,
  update: OperationItem,
): { updated: boolean; statusChanged: boolean } {
  const kanriNo = String(update.kanriNo);
  let updated = false;
  let statusChanged = false;

  for (const targetKey of ["operationEntities", "irregularEntities"] as const) {
    const targetGroup = state[targetKey];
    const entity = targetGroup[kanriNo];
    if (!entity) continue;

    const previousStatus = entity.status;
    const cloned = { ...entity };
    mergeStatus(cloned, update);

    targetGroup[kanriNo] = cloned;
    updated = true;
    if (previousStatus !== cloned.status) {
      statusChanged = true;
    }
  }

  return { updated, statusChanged };
}

const MIN_DISPLAY_TIME_MS = 3000;

export async function runJobWithGlobalProcessing(
  state: AppState,
  message: string,
  target: string,
  executeFn: () => Promise<void>,
): Promise<void> {
  const isAlreadyProcessing = state.globalProcessing !== null;
  if (!isAlreadyProcessing) {
    state.setGlobalProcessing({ message, target });
  }

  const startTime = Date.now();
  try {
    await executeFn();
  } finally {
    if (!isAlreadyProcessing) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = MIN_DISPLAY_TIME_MS - elapsedTime;
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
      state.setGlobalProcessing(null);
    }
  }
}

export function buildInitialOperationData(
  operations: OperationItem[],
  irregulars: OperationItem[],
  statuses: Record<string, OperationItem>,
) {
  const opMap = mapRawEntities(operations);
  const irrMap = mapRawEntities(irregulars);

  for (const [kanriNo, status] of Object.entries(statuses)) {
    if (opMap[kanriNo]) mergeStatus(opMap[kanriNo], status);
    if (irrMap[kanriNo]) mergeStatus(irrMap[kanriNo], status);
  }

  return {
    operationIds: operations.map(({ kanriNo }) => String(kanriNo)),
    operationEntities: opMap,
    irregularIds: irregulars.map(({ kanriNo }) => String(kanriNo)),
    irregularEntities: irrMap,
    todayIds: irregulars
      .filter(isIrregularToday)
      .map(({ kanriNo }) => String(kanriNo)),
  };
}
