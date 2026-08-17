// src/renderer/features/operation/helpers/operationEntities.ts

import type { AppState } from "@shared/store";
import { JOB_STATUS, type OperationItem } from "@shared/types/operationType";
import { mergeStatus } from "./statusFactory";
import { calculateNextStatus } from "./statusEvaluator";

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

  for (const entities of [state.operationEntities, state.irregularEntities]) {
    const entity = entities[kanriNo];
    if (!entity) continue;

    const previousStatus = entity.status;

    mergeStatus(entity, update);

    entity.status = calculateNextStatus(
      entity,
      update.status ?? undefined,
      allEntities,
      activeFlags,
    );

    updated = true;
    if (previousStatus !== entity.status) {
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
      mergeStatus(result[kanriNo], status);
      result[kanriNo].status = calculateNextStatus(
        result[kanriNo],
        status.status ?? undefined,
        result,
      );
    }
  }
  return result;
}

export function resetEntityStatus(entity: OperationItem): void {
  entity.status = JOB_STATUS.SCHEDULED;
  entity.comment = null;
  entity.startTime = null;
  entity.endTime = null;
  entity.expectedStartTime = null;
  entity.expectedEndTime = null;
  entity.substatus = null;
  entity.info = null;
}

export function resetAllEntityStatuses(state: AppState): void {
  for (const entities of [state.operationEntities, state.irregularEntities]) {
    for (const entity of Object.values(entities) as OperationItem[]) {
      resetEntityStatus(entity);
    }
  }
}
