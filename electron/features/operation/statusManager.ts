import { evaluateAllTargetStatuses } from "@electron/features/operation/evaluators/pollingStatusEvaluator";
import { broadcastStatusUpdate } from "@electron/features/operation/helpers/statusNotifier";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  schedulePersistStatuses,
  type PersistedStatus,
} from "@electron/features/operation/helpers/statusStorage";
import { isPollingRunning } from "@electron/features/operation/polling";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
  type OperationStatusFields,
} from "@shared/types/operationType";

export type { PersistedStatus };
export type StatusUpdate = Partial<OperationStatusFields> & {
  kanriNo: string | number;
};

// State (targetManager の Map を統合)
const apiTargets = new Map<string, OperationItem>();
const memoryStatuses = new Map<string, PersistedStatus>();

// ============================================================
// Target Management
// ============================================================
export function registerTargets(items: OperationItem[]): void {
  apiTargets.clear();
  let changed = false;

  for (const item of items) {
    const key = String(item.kanriNo);
    if (!key) continue;

    apiTargets.set(key, item);

    if (!memoryStatuses.has(key)) {
      memoryStatuses.set(key, sanitizeStatus(item));
      changed = true;
    }
  }

  if (changed) schedulePersistStatuses(memoryStatuses);
  console.log("[StatusManager] Targets registered:", {
    count: apiTargets.size,
  });
}

export function getTargetByKanriNo(kanriNo: string): OperationItem | undefined {
  return apiTargets.get(String(kanriNo));
}

export function getAllTargets(): OperationItem[] {
  return [...apiTargets.values()];
}

// ============================================================
// Status Management
// ============================================================
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

export function updateStatus(
  update: StatusUpdate,
  options?: { isManual?: boolean },
): boolean {
  const key = String(update.kanriNo);
  if (!key) return false;

  const previous = memoryStatuses.get(key);
  const next = sanitizeStatus({ ...previous, ...update });
  if (JSON.stringify(previous) === JSON.stringify(next)) return false;

  memoryStatuses.set(key, next);

  // 手動更新（isManual: true）ではない場合（＝Polling等による自動検出時）のみ通知を送信
  if (!options?.isManual) {
    const target = getTargetByKanriNo(key);
    broadcastStatusUpdate(key, {
      ...next,
      ...(target?.workName ? { workName: target.workName } : {}),
    });
  }

  schedulePersistStatuses(memoryStatuses);
  return true;
}

export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment: string,
): void {
  // 第2引数に { isManual: true } を渡して手動変更であることを明示し、トースト通知をスキップ
  updateStatus(
    {
      kanriNo,
      status,
      comment,
      endTime: new Date().toISOString(),
    },
    { isManual: true },
  );

  if (isPollingRunning()) {
    evaluateAllTargetStatuses(getAllTargets(), isPollingRunning);
  }
}

export async function deleteAllStatuses(): Promise<void> {
  memoryStatuses.clear();
  apiTargets.clear();
  await deleteStatusFile();
}

export async function initializeStatuses(): Promise<
  Record<string, PersistedStatus>
> {
  memoryStatuses.clear();
  const data = await loadStatusesFromFile();
  for (const [kanriNo, status] of Object.entries(data)) {
    memoryStatuses.set(String(kanriNo), sanitizeStatus(status));
  }
  return Object.fromEntries(memoryStatuses);
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
