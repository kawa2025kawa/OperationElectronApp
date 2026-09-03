// src/renderer/features/operation/helpers/operationEntities.ts

import type { AppState } from "@renderer/store";
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
import { checkJobDependencies } from "@shared/utils/dependencyHelper";

// ============================================================================
// Types
// ============================================================================

type OperationEntityState = Pick<
  AppState,
  "operationEntities" | "irregularEntities"
>;

type EntityCollection = Record<string, OperationItem> | OperationItem[];

export interface UpdateEntityResult {
  updated: boolean;
  statusChanged: boolean;
}

// ============================================================================
// Constants (ローカル定義)
// ============================================================================

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

export const DEFAULT_MODAL_SIZE = {
  width: "min(80vw, 800px)",
  height: "min(70vh, 550px)",
} as const;

const VALID_STATUSES = new Set<JobStatus>(STATUS_ORDER);

const ENTITY_KEYS = [
  "operationEntities",
  "irregularEntities",
] as const satisfies readonly (keyof OperationEntityState)[];

const MIN_GLOBAL_PROCESSING_DISPLAY_TIME_MS = 3000;

// ============================================================================
// Manual
// ============================================================================

export function getManualUrl(kanriNo: string | number): string {
  const normalizedKanriNo = String(kanriNo).trim();
  const targetKanriNo =
    MANUAL_ALIAS_MAP[normalizedKanriNo] ?? normalizedKanriNo;

  return `https://sites.google.com/belc.co.jp/operation-manual-${targetKanriNo}`;
}

// ============================================================================
// Entity Helpers
// ============================================================================

export function hasValidJobId(item: OperationItem): boolean {
  if (item.kind !== "operation") {
    return false;
  }

  return Boolean(item.jobId && item.jobId !== "-");
}

export function getAllEntitiesMap(
  state: OperationEntityState,
): Record<string, OperationItem> {
  return {
    ...state.operationEntities,
    ...state.irregularEntities,
  };
}

export const getAllEntities = getAllEntitiesMap;

export function getAllEntitiesArray(
  state: OperationEntityState & Pick<AppState, "todayIds">,
): OperationItem[] {
  const operations = Object.values(state.operationEntities);
  const todayIds = new Set(state.todayIds.map((id) => String(id)));

  const todayIrregulars = Object.values(state.irregularEntities).filter(
    (item) => todayIds.has(String(item.kanriNo)),
  );

  return [...operations, ...todayIrregulars];
}

export function findEntityByKanriNo(
  state: OperationEntityState,
  kanriNo: string | number,
): OperationItem | undefined {
  const key = String(kanriNo).trim();

  return state.operationEntities[key] ?? state.irregularEntities[key];
}

/**
 * 生成時に kind ("operation" | "irregular") を確定させてマッピング
 */
export function mapRawEntities(
  items: EntityCollection,
  kind: "operation" | "irregular",
): Record<string, OperationItem> {
  const source = Array.isArray(items) ? items : Object.values(items);

  return source.reduce<Record<string, OperationItem>>((entities, item) => {
    if (!item) {
      return entities;
    }

    const kanriNo = String(item.kanriNo).trim();

    if (!kanriNo) {
      return entities;
    }

    entities[kanriNo] = {
      ...item,
      kind,
    } as OperationItem;

    return entities;
  }, {});
}

// ============================================================================
// Summary
// ============================================================================

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
    if (!item?.status) {
      continue;
    }
    const status = item.status.toLowerCase() as JobStatus;
    if (!VALID_STATUSES.has(status)) {
      continue;
    }
    summary[status] += 1;
  }
  summary.progress =
    summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;
  return summary;
}

export async function runJobWithGlobalProcessing<T = void>(
  state: AppState,
  message: string,
  target: string,
  executeFn: () => Promise<T>,
): Promise<T> {
  const alreadyProcessing = state.globalProcessing !== null;
  if (!alreadyProcessing) {
    state.setGlobalProcessing({
      message,
      target,
    });
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

// ============================================================================
// Status Merge
// ============================================================================

function mergeStringValue(
  next: string | null | undefined,
  current: string | null | undefined,
): string | null {
  const normalizedNext = next?.trim();

  if (normalizedNext) {
    return normalizedNext;
  }

  return current ?? null;
}

export function mergeStatus(
  entity: OperationItem,
  update: OperationItem,
): void {
  if (update.status) {
    entity.status = update.status;
  }

  if (update.comment != null) {
    const comment = update.comment.trim();

    if (comment) {
      entity.comment = comment;
    }
  }

  entity.startTime = mergeStringValue(update.startTime, entity.startTime);

  entity.endTime = mergeStringValue(update.endTime, entity.endTime);

  entity.expectedStartTime = mergeStringValue(
    update.expectedStartTime,
    entity.expectedStartTime,
  );

  entity.expectedEndTime = mergeStringValue(
    update.expectedEndTime,
    entity.expectedEndTime,
  );

  if (update.substatus != null) {
    entity.substatus = update.substatus;
  }

  if (update.info != null) {
    entity.info = update.info;
  }
}

// ============================================================================
// Status Factory
// ============================================================================

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

// ============================================================================
// Entity Updates
// ============================================================================

export function updateEntityInState(
  state: AppState,
  update: OperationItem,
): UpdateEntityResult {
  const kanriNo = String(update.kanriNo).trim();

  let updated = false;
  let statusChanged = false;

  for (const entityKey of ENTITY_KEYS) {
    const entity = state[entityKey][kanriNo];

    if (!entity) {
      continue;
    }

    const previousStatus = entity.status;

    mergeStatus(entity, update);

    updated = true;
    statusChanged ||= previousStatus !== entity.status;
  }

  return {
    updated,
    statusChanged,
  };
}

// ============================================================================
// Reset
// ============================================================================

function resetEntityStatus(entity: OperationItem): OperationItem {
  return {
    ...entity,
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

export function resetAllEntityStatuses(state: AppState): void {
  for (const entityKey of ENTITY_KEYS) {
    const entities = state[entityKey];

    for (const [kanriNo, entity] of Object.entries(entities)) {
      entities[kanriNo] = resetEntityStatus(entity);
    }
  }
}

// ============================================================================
// Initial Data
// ============================================================================

export function buildInitialOperationData(
  operations: OperationItem[],
  irregulars: OperationItem[],
  statuses: Record<string, OperationItem>,
) {
  const operationEntities = mapRawEntities(operations, "operation");
  const irregularEntities = mapRawEntities(irregulars, "irregular");

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

/**
 * 全ジョブの依存関係を再評価し、条件が満たされたジョブのステータスを即座に更新する（連鎖更新対応）。
 */
export function evaluateDependenciesCascade(state: AppState): boolean {
  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };

  let anyChanged = false;
  let hasChangesInLoop = true;

  while (hasChangesInLoop) {
    hasChangesInLoop = false;
    const entities = getAllEntitiesMap(state);

    for (const item of Object.values(entities)) {
      if (!item.dependency) {
        continue;
      }

      if (
        item.status === JOB_STATUS.RUNNING ||
        item.status === JOB_STATUS.SCRIPT_RUNNING ||
        item.status === JOB_STATUS.SUCCESS ||
        item.status === JOB_STATUS.ERROR
      ) {
        continue;
      }

      const check = checkJobDependencies(item.kanriNo, entities, activeFlags);

      if (check.ok) {
        if (
          item.status === JOB_STATUS.WAITING ||
          item.status === JOB_STATUS.SCHEDULED
        ) {
          item.status = JOB_STATUS.READY;
          hasChangesInLoop = true;
          anyChanged = true;
        }
      } else {
        if (
          item.status === JOB_STATUS.READY ||
          item.status === JOB_STATUS.SCHEDULED
        ) {
          item.status = JOB_STATUS.WAITING;
          hasChangesInLoop = true;
          anyChanged = true;
        }
      }
    }
  }

  return anyChanged;
}
