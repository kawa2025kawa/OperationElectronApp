// src/renderer/features/operation/helpers/operationEntities.ts

import type { AppState } from "@shared/store";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";
import { calculateNextStatus } from "./statusEvaluator";
import { mergeStatus } from "./statusFactory";

export function getAllEntities(
  state: Pick<AppState, "operationEntities" | "irregularEntities">,
): Record<string, OperationItem> {
  return { ...state.operationEntities, ...state.irregularEntities };
}

export function findEntityByKanriNo(
  state: Pick<AppState, "operationEntities" | "irregularEntities">,
  kanriNo: string | number,
): OperationItem | undefined {
  const key = String(kanriNo);
  return state.operationEntities[key] ?? state.irregularEntities[key];
}

function applyStatusUpdateToEntity(
  entity: OperationItem,
  update: OperationItem,
  allEntities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): { cloned: OperationItem; statusChanged: boolean } {
  const previousStatus = entity.status;
  const cloned = { ...entity };
  mergeStatus(cloned, update);
  cloned.status = calculateNextStatus(
    cloned,
    update.status ?? undefined,
    allEntities,
    activeFlags,
  );
  return {
    cloned,
    statusChanged: previousStatus !== cloned.status,
  };
}

export function updateEntityInState(
  state: AppState,
  update: OperationItem,
): { updated: boolean; statusChanged: boolean } {
  const kanriNo = String(update.kanriNo);
  let updated = false;
  let statusChanged = false;
  const allEntities = getAllEntities(state);
  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };

  for (const targetKey of ["operationEntities", "irregularEntities"] as const) {
    const targetGroup = state[targetKey];
    const entity = targetGroup[kanriNo];
    if (!entity) continue;

    const result = applyStatusUpdateToEntity(
      entity,
      update,
      allEntities,
      activeFlags,
    );
    targetGroup[kanriNo] = result.cloned;
    updated = true;
    if (result.statusChanged) {
      statusChanged = true;
    }
  }

  return { updated, statusChanged };
}

export function applyPersistedStatuses(
  entities: Record<string, OperationItem>,
  statuses: Record<string, OperationItem>,
): Record<string, OperationItem> {
  const result = { ...entities };
  for (const [kanriNo, status] of Object.entries(statuses)) {
    if (result[kanriNo]) {
      const { cloned } = applyStatusUpdateToEntity(
        result[kanriNo],
        status,
        result,
      );
      result[kanriNo] = cloned;
    }
  }
  return result;
}

export function resetEntityStatus(entity: OperationItem): OperationItem {
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
  for (const targetKey of ["operationEntities", "irregularEntities"] as const) {
    const targetGroup = state[targetKey];
    for (const [key, entity] of Object.entries(targetGroup)) {
      targetGroup[key] = resetEntityStatus(entity as OperationItem);
    }
  }
}
