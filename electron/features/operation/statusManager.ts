// electron/features/operation/statusManager.ts
import { BrowserWindow } from "electron";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  schedulePersistStatuses,
  type PersistedStatus,
} from "@electron/features/operation/helpers/statusStorage";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
  type OperationStatusFields,
} from "@shared/types/operation";

import {
  isPollingRunning,
  runCycle,
} from "@electron/features/operation/polling";

export type { PersistedStatus };
export type StatusUpdate = Partial<OperationStatusFields> & {
  kanriNo: string | number;
};

export interface ActiveFlags {
  is1CActive: boolean;
  is2CActive: boolean;
  is3CActive: boolean;
}

const apiTargets = new Map<string, OperationItem>();
const memoryStatuses = new Map<string, PersistedStatus>();
let activeFlags: ActiveFlags = {
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,
};

export function broadcastStatusUpdate(item: OperationItem): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed())
      win.webContents.send("operationStatusUpdated", { status: item });
  });
}

export function setActiveFlags(
  flags?: Partial<ActiveFlags> | Record<string, boolean>,
): void {
  activeFlags = {
    is1CActive: Boolean(flags?.is1CActive),
    is2CActive: Boolean(flags?.is2CActive),
    is3CActive: Boolean(flags?.is3CActive),
  };
  if (isPollingRunning()) void runCycle();
}

export function sanitizeStatus(
  item: Partial<OperationItem | OperationStatusFields>,
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

export function getMergedEntity(target: OperationItem): OperationItem {
  const key = String(target.kanriNo).trim();
  const p = memoryStatuses.get(key);
  return {
    ...target,
    kanriNo: key,
    status: p?.status ?? target.status ?? JOB_STATUS.SCHEDULED,
    comment: p?.comment ?? target.comment ?? "",
    startTime: p?.startTime ?? null,
    endTime: p?.endTime ?? null,
    expectedStartTime: p?.expectedStartTime ?? null,
    expectedEndTime: p?.expectedEndTime ?? null,
    substatus: p?.substatus ?? null,
    info: p?.info ?? null,
  };
}

export function registerTargets(items: OperationItem[]): void {
  apiTargets.clear();
  const validKeys = new Set<string>();
  let changed = false;

  for (const rawItem of items) {
    const key = String(rawItem?.kanriNo ?? "").trim();
    if (!key) continue;
    const kind =
      rawItem.kind ?? ((rawItem as any).jobId ? "operation" : "irregular");
    const item = { ...rawItem, kind } as OperationItem;
    apiTargets.set(key, item);
    validKeys.add(key);

    if (!memoryStatuses.has(key)) {
      memoryStatuses.set(key, sanitizeStatus(item));
      changed = true;
    }
  }

  for (const key of memoryStatuses.keys()) {
    if (!validKeys.has(key)) {
      memoryStatuses.delete(key);
      changed = true;
    }
  }
  if (changed) schedulePersistStatuses(memoryStatuses);
}

export function updateStatus(update: StatusUpdate): boolean {
  const key = String(update.kanriNo).trim();
  if (!key) return false;

  const previous = memoryStatuses.get(key);
  const next = sanitizeStatus({ ...previous, ...update });

  if (previous && JSON.stringify(previous) === JSON.stringify(next))
    return false;

  // 🎯 ステータス値が変更されたかチェック
  const statusChanged = previous?.status !== next.status;

  memoryStatuses.set(key, next);
  const target = apiTargets.get(key);
  if (target) broadcastStatusUpdate(getMergedEntity(target));
  schedulePersistStatuses(memoryStatuses);

  // 🎯 ステータスが変わった場合、ポーリング実行中であれば即座にサイクルを呼び出す
  // (これによって依存関係再評価、API同期、自動起動チェックが即時実行されます)
  if (statusChanged && isPollingRunning()) {
    void runCycle();
  }

  return true;
}

export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment: string,
): void {
  updateStatus({ kanriNo, status, comment, endTime: new Date().toISOString() });
  // updateStatus 内で runCycle が呼ばれるため、ここでの個別呼び出しは無くても機能します
}

export const getTargetByKanriNo = (kanriNo: string | number) =>
  apiTargets.get(String(kanriNo).trim());
export const getAllTargets = () =>
  Array.from(apiTargets.values(), getMergedEntity);
export const getStatus = (kanriNo: string | number) =>
  memoryStatuses.get(String(kanriNo).trim());
export const getActiveFlags = () => activeFlags;

export async function deleteAllStatuses(): Promise<void> {
  memoryStatuses.clear();
  await deleteStatusFile();
}

export async function initializeStatuses(): Promise<
  Record<string, PersistedStatus>
> {
  memoryStatuses.clear();
  const data = await loadStatusesFromFile();
  for (const [key, status] of Object.entries(data)) {
    const sanitized = sanitizeStatus(status);
    if (
      sanitized.status === JOB_STATUS.RUNNING ||
      sanitized.status === JOB_STATUS.SCRIPT_RUNNING
    ) {
      sanitized.status = JOB_STATUS.READY;
      sanitized.comment = "再起動のため初期化";
    }
    memoryStatuses.set(String(key).trim(), sanitized);
  }
  return Object.fromEntries(memoryStatuses);
}
