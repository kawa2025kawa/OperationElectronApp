// electron/features/operation/helpers/trackerMapper.ts
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";

export interface TrackerApiResponseItem {
  status?: string[];
  start_time?: string;
  end_time?: string;
  expected_start_time?: string;
  expected_end_time?: string;
  comment?: string;
  substatus?: string[];
  info?: string;
}

export interface TrackerApiResponse {
  count: number;
  data: TrackerApiResponseItem[];
}

export function normalizeStatus(status?: string[]): JobStatus | undefined {
  if (!status?.length) return undefined;
  const values = status.map((v) => v.toLowerCase());
  if (
    values.includes("done") ||
    values.includes("success") ||
    values.includes("normal") ||
    values.includes("end")
  ) {
    return JOB_STATUS.SUCCESS;
  }
  if (
    values.includes("error") ||
    values.includes("failed") ||
    values.includes("err")
  ) {
    return JOB_STATUS.ERROR;
  }
  if (
    values.includes("running") ||
    values.includes("run") ||
    values.includes("executing")
  ) {
    return JOB_STATUS.RUNNING;
  }
  return undefined;
}

export function normalizeItem(
  item: TrackerApiResponseItem,
): Partial<OperationItem> {
  return {
    status: normalizeStatus(item.status),
    startTime: item.start_time,
    endTime: item.end_time,
    expectedStartTime: item.expected_start_time,
    expectedEndTime: item.expected_end_time,
    comment: item.comment,
    substatus: item.substatus,
    info: item.info,
  };
}

export function applyTrackerItem(
  tracker: Partial<OperationItem>,
  base: OperationItem,
): OperationItem {
  return {
    ...base,
    status: tracker.status ?? base.status,
    startTime: tracker.startTime ?? base.startTime,
    endTime: tracker.endTime ?? base.endTime,
    expectedStartTime: tracker.expectedStartTime ?? base.expectedStartTime,
    expectedEndTime: tracker.expectedEndTime ?? base.expectedEndTime,
    comment: tracker.comment ?? base.comment,
    substatus: tracker.substatus ?? base.substatus,
    info: tracker.info ?? base.info,
  };
}
