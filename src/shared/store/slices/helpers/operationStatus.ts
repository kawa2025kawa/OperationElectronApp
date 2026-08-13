// src/shared/store/slices/helpers/operationStatus.ts

import type { OperationItem } from "@shared/types/operationType";

const mergeNonEmptyString = (
  next: string | null | undefined,
  current: string | null | undefined,
): string | null => {
  return next?.trim() || current || null;
};

export const mergeStatus = (
  entity: OperationItem,
  update: OperationItem,
): void => {
  entity.status = update.status ?? entity.status ?? "scheduled";

  if (update.comment != null) {
    const comment = update.comment.trim();

    if (comment) {
      entity.comment = comment;
    }
  }

  entity.startTime = mergeNonEmptyString(update.startTime, entity.startTime);

  entity.endTime = mergeNonEmptyString(update.endTime, entity.endTime);

  entity.expectedStartTime = mergeNonEmptyString(
    update.expectedStartTime,
    entity.expectedStartTime,
  );

  entity.expectedEndTime = mergeNonEmptyString(
    update.expectedEndTime,
    entity.expectedEndTime,
  );

  if (update.substatus?.length) {
    entity.substatus = update.substatus;
  }

  if (update.info != null) {
    entity.info = update.info;
  }
};
