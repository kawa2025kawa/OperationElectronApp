// electron/features/operation/statusManager.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
  type OperationStatusFields,
} from "@shared/types/operationType";
import { evaluateAllTargetStatuses } from "@electron/features/operation/evaluators/pollingStatusEvaluator";
import { broadcastStatusUpdate } from "@electron/features/operation/helpers/statusNotifier";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  schedulePersistStatuses,
  type PersistedStatus,
} from "@electron/features/operation/helpers/statusStorage";
import { isPollingRunning } from "@electron/features/operation/polling";
import { getAllTargets } from "@electron/features/operation/targetManager";

export type { PersistedStatus };
export type StatusUpdate = Partial<OperationStatusFields> & {
  kanriNo: string | number;
};

const memoryStatuses = new Map<string, PersistedStatus>();

export async function initializeStatuses(): Promise<
  Record<string, PersistedStatus>
> {
  memoryStatuses.clear();
  // loadStatusesFromFile 内部で古いログ/ステータスファイルの cleanup 処理が自動実行されます
  const data = await loadStatusesFromFile();
  for (const [kanriNo, status] of Object.entries(data)) {
    memoryStatuses.set(String(kanriNo), sanitizeStatus(status));
  }
  return Object.fromEntries(memoryStatuses);
}

export function registerTargets(items: OperationItem[]): void {
  let changed = false;
  for (const item of items) {
    const key = String(item.kanriNo);
    if (!key || memoryStatuses.has(key)) continue;
    memoryStatuses.set(key, sanitizeStatus(item));
    changed = true;
  }
  if (changed) schedulePersistStatuses(memoryStatuses);
}

export function getStatus(
  kanriNo: string | number,
): PersistedStatus | undefined {
  return memoryStatuses.get(String(kanriNo));
}

export function getMergedEntity(target: OperationItem): OperationItem {
  const key = String(target.kanriNo);
  const persisted = memoryStatuses.get(key);
  return {
    ...target,
    kanriNo: key,
    status: persisted?.status ?? target.status ?? JOB_STATUS.SCHEDULED,
    comment: persisted?.comment ?? target.comment ?? "",
    startTime: persisted?.startTime ?? null,
    endTime: persisted?.endTime ?? null,
    expectedStartTime: persisted?.expectedStartTime ?? null,
    expectedEndTime: persisted?.expectedEndTime ?? null,
    substatus: persisted?.substatus ?? null,
    info: persisted?.info ?? null,
  };
}

export function getAllStatuses(): Array<PersistedStatus & { kanriNo: string }> {
  return [...memoryStatuses.entries()].map(([kanriNo, status]) => ({
    kanriNo,
    ...status,
  }));
}

export function updateStatus(update: StatusUpdate): boolean {
  const key = String(update.kanriNo);
  if (!key) return false;

  const previous = memoryStatuses.get(key);
  const next = sanitizeStatus({ ...previous, ...update });

  if (JSON.stringify(previous) === JSON.stringify(next)) return false;

  memoryStatuses.set(key, next);
  broadcastStatusUpdate(key, next);
  schedulePersistStatuses(memoryStatuses);
  return true;
}

export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment: string,
): void {
  updateStatus({
    kanriNo,
    status,
    comment,
    endTime: new Date().toISOString(),
  });

  if (isPollingRunning()) {
    evaluateAllTargetStatuses(getAllTargets(), isPollingRunning);
  }
}

export async function deleteAllStatuses(): Promise<void> {
  memoryStatuses.clear();
  await deleteStatusFile();
}

function sanitizeStatus(
  item: Partial<OperationItem> | Partial<OperationStatusFields>,
): PersistedStatus {
  return {
    status: item.status ?? JOB_STATUS.SCHEDULED,
    comment: item.comment ?? "",
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    expectedStartTime: item.expectedStartTime ?? null,
    expectedEndTime: item.expectedEndTime ?? null,
    substatus: item.substatus ?? null,
    info: item.info ?? null,
  };
}
