// src/renderer/features/operation/helpers/statusFactory.ts

import {
  JOB_STATUS,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

export function createErrorStatus(
  current: OperationStatusState | undefined,
  message: string,
): OperationStatusState {
  return {
    kanriNo: current?.kanriNo ?? "",
    status: JOB_STATUS.ERROR,
    comment: message,
    startTime: current?.startTime ?? null,
    endTime: current?.endTime ?? null,
    expectedStartTime: current?.expectedStartTime ?? null,
    expectedEndTime: current?.expectedEndTime ?? null,
    substatus: current?.substatus ?? null,
    info: current?.info ?? null,
  };
}
