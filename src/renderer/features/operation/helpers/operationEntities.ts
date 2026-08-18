//src\renderer\features\operation\helpers\operationEntities.ts

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

  for (const targetKey of ["operationEntities", "irregularEntities"] as const) {
    const targetGroup = state[targetKey];
    const entity = targetGroup[kanriNo];
    if (!entity) continue;

    const previousStatus = entity.status;

    // ⭕ 読み取り専用オブジェクトのプロパティ変更エラーを回避するため浅いコピーを作成
    const clonedEntity = { ...entity };
    mergeStatus(clonedEntity, update);

    clonedEntity.status = calculateNextStatus(
      clonedEntity,
      update.status ?? undefined,
      allEntities,
      activeFlags,
    );

    targetGroup[kanriNo] = clonedEntity;

    updated = true;
    if (previousStatus !== clonedEntity.status) {
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
      // ⭕ 読み取り専用オブジェクトのプロパティ変更エラーを回避するため浅いコピーを作成
      const clonedEntity = { ...result[kanriNo] };
      mergeStatus(clonedEntity, status);

      clonedEntity.status = calculateNextStatus(
        clonedEntity,
        status.status ?? undefined,
        result,
      );

      result[kanriNo] = clonedEntity;
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
