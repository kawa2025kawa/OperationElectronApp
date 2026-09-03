// electron/features/operation/statusManager.ts

import { BrowserWindow } from "electron";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  schedulePersistStatuses,
  type PersistedStatus,
} from "@electron/features/operation/helpers/statusStorage";
import {
  isPollingRunning,
  runCycle,
} from "@electron/features/operation/polling";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
  type OperationStatusFields,
} from "@shared/types/operation";
import type { StatusSummary } from "@shared/types/ui";

export type { PersistedStatus };
export type StatusUpdate = Partial<OperationStatusFields> & {
  kanriNo: string | number;
};

// State
const apiTargets = new Map<string, OperationItem>();
const memoryStatuses = new Map<string, PersistedStatus>();

// Store から同期された一元管理サマリー
let latestStoreSummary: StatusSummary | null = null;

let activeFlags: Record<string, boolean> = {
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,
};

// ============================================================
// Broadcast & Store Sync Notification
// ============================================================
export function broadcastStatusUpdate(item: OperationItem): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("operationStatusUpdated", { status: item });
    }
  }
}

/**
 * UI (Zustand Store) 側で計算・管理されている StatusSummary を同期受領する
 */
export function syncSummaryFromStore(summary: StatusSummary): void {
  latestStoreSummary = summary;
  console.log(
    "[StatusManager] Synchronized with Store StatusSummary:",
    latestStoreSummary,
  );
}

export function getActiveFlags(): Record<string, boolean> {
  return activeFlags;
}

export function setActiveFlags(flags: Record<string, boolean>): void {
  activeFlags = { ...flags };
  if (isPollingRunning()) void runCycle();
}

// ============================================================
// Target Management
// ============================================================
export function registerTargets(items: OperationItem[]): void {
  apiTargets.clear();
  const validKeys = new Set<string>();
  let changed = false;

  for (const rawItem of items) {
    const key = String(rawItem?.kanriNo ?? "").trim();
    if (!key) continue;

    const kind =
      rawItem.kind ?? ((rawItem as any).jobId ? "operation" : "irregular");
    const item: OperationItem = { ...rawItem, kind } as OperationItem;

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

export function getTargetByKanriNo(
  kanriNo: string | number,
): OperationItem | undefined {
  return apiTargets.get(String(kanriNo).trim());
}

/** 常に最新のステータス統合データを取得 */
export function getAllTargets(): OperationItem[] {
  const targets = Array.from(apiTargets.values(), getMergedEntity);

  // Store から同期された一元サマリーログを出力
  if (latestStoreSummary) {
    console.log("[StatusManager] Store Summary Status:", latestStoreSummary);
  }

  return targets;
}

// ============================================================
// Status Management
// ============================================================
export function getStatus(
  kanriNo: string | number,
): PersistedStatus | undefined {
  return memoryStatuses.get(String(kanriNo).trim());
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

function isStatusEqual(a: PersistedStatus, b: PersistedStatus): boolean {
  return (
    a.status === b.status &&
    a.comment === b.comment &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.expectedStartTime === b.expectedStartTime &&
    a.expectedEndTime === b.expectedEndTime &&
    a.info === b.info &&
    (a.substatus === b.substatus ||
      JSON.stringify(a.substatus) === JSON.stringify(b.substatus))
  );
}

export function updateStatus(
  update: StatusUpdate,
  _options?: { isManual?: boolean },
): boolean {
  const key = String(update.kanriNo).trim();
  if (!key) return false;

  const previous = memoryStatuses.get(key);
  const next = sanitizeStatus({ ...previous, ...update });

  if (previous && isStatusEqual(previous, next)) return false;

  memoryStatuses.set(key, next);

  const target = getTargetByKanriNo(key);
  if (target) broadcastStatusUpdate(getMergedEntity(target));

  schedulePersistStatuses(memoryStatuses);
  return true;
}

export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment: string,
): void {
  updateStatus(
    { kanriNo, status, comment, endTime: new Date().toISOString() },
    { isManual: true },
  );
  if (isPollingRunning()) void runCycle();
}

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

    // アプリ再起動時、実行中ステータスは実プロセスが存在しないため ready へリセット
    if (
      sanitized.status === JOB_STATUS.RUNNING ||
      sanitized.status === JOB_STATUS.SCRIPT_RUNNING
    ) {
      sanitized.status = JOB_STATUS.READY;
      sanitized.comment = "アプリ再起動により再評価待ち";
    }

    memoryStatuses.set(String(key).trim(), sanitized);
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
