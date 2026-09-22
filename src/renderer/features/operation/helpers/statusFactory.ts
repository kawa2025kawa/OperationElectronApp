import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation/operationTypes";

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
