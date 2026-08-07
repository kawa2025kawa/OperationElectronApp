// src/shared/store/slices/helpers/operationSummary.ts

import type { JobStatus } from "@shared/types/operationType";
import type { OperationItem } from "@shared/types/operationType";
import { STATUS_ORDER, type StatusSummary } from "@shared/types/uiType";

export const INITIAL_SUMMARY: StatusSummary = {
  PROGRESS: 0,
  TOTAL: 0,
  SUCCESS: 0,
  RUNNING: 0,
  SCRIPTRUNNING: 0,
  WAITING: 0,
  SCHEDULED: 0,
  READY: 0,
  ERROR: 0,
};

const VALID_STATUSES: Set<string> = new Set(STATUS_ORDER);

export function isJobStatus(status: string): status is JobStatus {
  return VALID_STATUSES.has(status);
}

const pickValidTime = (
  ...values: (string | null | undefined)[]
): string | null => {
  for (const val of values) {
    if (val !== undefined && val !== null && val.trim() !== "") {
      return val;
    }
  }
  return null;
};

export function parseSingleStatus(
  rawStatus?: string | JobStatus | null,
): JobStatus {
  if (!rawStatus) return "scheduled";
  const lower = String(rawStatus).toLowerCase().trim();
  if (["run", "running", "executing"].includes(lower)) return "running";
  if (["scriptrunning", "scriptRunning"].includes(lower))
    return "scriptRunning";
  if (["waiting", "wait"].includes(lower)) return "waiting";
  if (lower === "scheduled") return "scheduled";
  if (lower === "ready") return "ready";
  if (["error", "failed", "err"].includes(lower)) return "error";
  if (["warning", "done", "success", "normal", "end"].includes(lower))
    return "success";
  return isJobStatus(lower) ? (lower as JobStatus) : "scheduled";
}

export function mapRawEntities(
  rawList: OperationItem[],
  statuses: Record<string, OperationItem>,
): Record<string, OperationItem> {
  const entities: Record<string, OperationItem> = {};
  for (const raw of rawList) {
    const k = String(raw.kanriNo);
    const savedStatus = statuses[k];
    const finalStatus = parseSingleStatus(savedStatus?.status ?? raw.status);
    entities[k] = {
      ...raw,
      kanriNo: k,
      status: finalStatus,
      comment: savedStatus?.comment ?? raw.comment ?? "",
      startTime: pickValidTime(savedStatus?.startTime, raw.startTime),
      endTime: pickValidTime(savedStatus?.endTime, raw.endTime),
      expectedStartTime: pickValidTime(
        savedStatus?.expectedStartTime,
        raw.expectedStartTime,
      ),
      expectedEndTime: pickValidTime(
        savedStatus?.expectedEndTime,
        raw.expectedEndTime,
      ),
      substatus: savedStatus?.substatus?.length
        ? savedStatus.substatus
        : (raw.substatus ?? null),
    };
  }
  return entities;
}

export function calculateSummary(
  entities: Record<string, OperationItem>,
): StatusSummary {
  const allItems = Object.values(entities);
  const totalCount = allItems.length;
  const summary: StatusSummary = { ...INITIAL_SUMMARY, TOTAL: totalCount };

  for (const item of allItems) {
    if (!item.status) continue;
    const key = item.status.toUpperCase() as keyof StatusSummary;
    if (key in summary) {
      summary[key]++;
    }
  }

  summary.PROGRESS =
    totalCount > 0 ? Math.round((summary.SUCCESS / totalCount) * 100) : 0;
  return summary;
}
