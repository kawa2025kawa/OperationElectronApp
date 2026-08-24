// src/renderer/features/operation/helpers/statusFactory.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";

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
