import type { JobStatus, OperationItem } from "@shared/types/operationType";

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

const createBaseStatus = (
  kanriNo: string,
  item: OperationItem | undefined,
  status: JobStatus,
  comment: string,
): OperationItem => {
  if (!item) {
    throw new Error(`OperationItem not found. kanriNo=${kanriNo}`);
  }

  return {
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
  };
};

export const createRunningStatus = (
  kanriNo: string,
  item: OperationItem,
  comment = "処理中...",
): OperationItem => {
  return createBaseStatus(kanriNo, item, "running", comment);
};

export const createErrorStatus = (
  kanriNo: string,
  item: OperationItem,
  message: string,
): OperationItem => {
  return createBaseStatus(kanriNo, item, "error", message);
};

export const createSuccessStatus = (
  kanriNo: string,
  item: OperationItem,
  comment: string,
  status: JobStatus = "success",
): OperationItem => {
  return createBaseStatus(kanriNo, item, status, comment);
};
