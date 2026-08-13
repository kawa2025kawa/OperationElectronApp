// src/shared/store/slices/helpers/resetOperationStatus.ts

import type { AppState } from "@shared/store";
import type { OperationItem } from "@shared/types/operationType";

export const resetEntityStatus = (entity: OperationItem): void => {
  entity.status = "scheduled";
  entity.comment = null;
  entity.startTime = null;
  entity.endTime = null;
  entity.expectedStartTime = null;
  entity.expectedEndTime = null;
  entity.substatus = null;
  entity.info = null;
};

export const resetAllEntityStatuses = (state: AppState): void => {
  for (const entities of [state.operationEntities, state.irregularEntities]) {
    for (const entity of Object.values(entities)) {
      resetEntityStatus(entity);
    }
  }
};
