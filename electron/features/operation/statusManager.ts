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

export type { PersistedStatus };
export type StatusUpdate = Partial<OperationStatusFields> & {
  kanriNo: string | number;
};

// デバッグ対象の識別子
const DEBUG_TARGET_KEYWORDS = [
  "BENIF0001_外部システム向けマスタＩＦ",
  "NMA8200",
  "76",
];

function isDebugTarget(key: string, target?: OperationItem): boolean {
  const jobId = target?.kind === "operation" ? String(target.jobId ?? "") : "";
  const checkStr = `${key} ${jobId} ${target?.workName ?? ""}`;
  return DEBUG_TARGET_KEYWORDS.some((kw) => checkStr.includes(kw));
}

// State
const apiTargets = new Map<string, OperationItem>();
const memoryStatuses = new Map<string, PersistedStatus>();

// センターアクティブフラグの保持
let activeFlags: Record<string, boolean> = {
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,
};

// ============================================================
// Broadcast Notification (旧 statusNotifier.ts から吸収)
// ============================================================
export function broadcastStatusUpdate(item: OperationItem): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send("operationStatusUpdated", {
        status: item,
      });
    }
  });
}

export function getActiveFlags(): Record<string, boolean> {
  return activeFlags;
}

export function setActiveFlags(flags: Record<string, boolean>): void {
  activeFlags = { ...flags };
  if (isPollingRunning()) {
    void runCycle();
  }
}

// ============================================================
// Target Management
// ============================================================
export function registerTargets(items: OperationItem[]): void {
  apiTargets.clear();
  const validKeys = new Set<string>();
  let changed = false;

  for (const item of items) {
    const key = String(item.kanriNo);
    if (!key) continue;

    apiTargets.set(key, item);
    validKeys.add(key);

    if (!memoryStatuses.has(key)) {
      memoryStatuses.set(key, sanitizeStatus(item));
      changed = true;
    }
  }

  // 存在しなくなった旧ジョブのステータス情報をメモリから削除
  for (const key of memoryStatuses.keys()) {
    if (!validKeys.has(key)) {
      memoryStatuses.delete(key);
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

  const target = getTargetByKanriNo(key);
  const debug = isDebugTarget(key, target);

  const previous = memoryStatuses.get(key);
  const next = sanitizeStatus({ ...previous, ...update });

  if (debug) {
    console.log(
      `\n[DEBUG-STATUS-UPDATE] kanriNo: ${key} (${target?.workName ?? "Unknown"})`,
      {
        prevStatus: previous?.status ?? "none",
        nextStatus: next.status,
        updatePayload: update,
      },
    );
  }

  // 変化がなければ送信を止める判定箇所
  if (JSON.stringify(previous) === JSON.stringify(next)) {
    if (debug) {
      console.log(
        `[DEBUG-STATUS-UPDATE] ❌ 変化なしのため送信キャンセル (prev === next)`,
      );
    }
    return false;
  }

  memoryStatuses.set(key, next);

  if (target) {
    const mergedItem = getMergedEntity(target);
    if (debug) {
      console.log(`[DEBUG-STATUS-UPDATE] ⭕ UIへIPC放送送信準備完了:`, {
        kanriNo: mergedItem.kanriNo,
        status: mergedItem.status,
      });
    }
    broadcastStatusUpdate(mergedItem);
  } else if (debug) {
    console.log(
      `[DEBUG-STATUS-UPDATE] ⚠️ apiTargetsにTargetが存在しないためbroadcast中止`,
    );
  }

  schedulePersistStatuses(memoryStatuses);
  return true;
}

export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment: string,
): void {
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
    void runCycle();
  }
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
