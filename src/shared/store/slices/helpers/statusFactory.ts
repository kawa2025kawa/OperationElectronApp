// src/shared/store/slices/helpers/statusFactory.ts

import type { JobStatus, OperationItem } from "@shared/types/operationType";

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

    substatus: item.substatus ?? null,

    expectedStartTime: item.expectedStartTime?.trim() ? item.expectedStartTime : null,

    expectedEndTime: item.expectedEndTime?.trim() ? item.expectedEndTime : null,
  };
};

export const createRunningStatus = (
  kanriNo: string,
  item: OperationItem,
  comment = "実行中...",
): OperationItem => createBaseStatus(kanriNo, item, "running", comment);

export const createErrorStatus = (
  kanriNo: string,
  item: OperationItem,
  message: string,
): OperationItem => createBaseStatus(kanriNo, item, "error", message);

export const createSuccessStatus = (
  kanriNo: string,
  item: OperationItem,
  comment: string,
  status: JobStatus = "success",
): OperationItem => createBaseStatus(kanriNo, item, status, comment);
