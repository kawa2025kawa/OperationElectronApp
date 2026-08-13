// electron/services/statusManager.ts

import path from "node:path";

import { app, BrowserWindow } from "electron";
import { format } from "date-fns";
import fs from "fs-extra";

import type { JobStatus, OperationItem } from "@shared/types/operationType";

// ============================================================
// Types
// ============================================================

export type PersistedStatus = Pick<
  OperationItem,
  | "status"
  | "comment"
  | "startTime"
  | "endTime"
  | "expectedStartTime"
  | "expectedEndTime"
  | "substatus"
  | "info"
>;

export type StatusUpdate = Pick<
  OperationItem,
  | "status"
  | "comment"
  | "startTime"
  | "endTime"
  | "expectedStartTime"
  | "expectedEndTime"
  | "substatus"
  | "info"
> & {
  kanriNo: string | number;
};

// ============================================================
// Constants
// ============================================================

/**
 * Status更新が連続した場合、
 * 最後の更新から一定時間経過してからまとめて保存する。
 *
 * 例:
 *   1件目更新 → 保存予約
 *   2件目更新 → 保存予約を延長
 *   3件目更新 → 保存予約を延長
 *   ...
 *   ↓
 *   一定時間更新が止まったところで1回だけ保存
 */
const STATUS_SAVE_DEBOUNCE_MS = 300;

// ============================================================
// State
// ============================================================

const memoryStatuses = new Map<string, PersistedStatus>();

let saveTimer: NodeJS.Timeout | null = null;
let saveInProgress = false;
let savePending = false;

// ============================================================
// File
// ============================================================

function getTodaySuffix(): string {
  return format(new Date(), "yyyyMMdd");
}

function getStatusFilePath(): string {
  return path.join(
    app.getPath("userData"),
    `operationStatuses_${getTodaySuffix()}.json`,
  );
}

// ============================================================
// Persistence
// ============================================================

/**
 * Status保存を予約する。
 *
 * 連続更新時は保存をまとめる。
 */
function schedulePersistStatuses(): void {
  savePending = true;

  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;

    void persistStatuses();
  }, STATUS_SAVE_DEBOUNCE_MS);
}

/**
 * Statusをファイルへ保存する。
 *
 * 保存中に新しい更新が入った場合は、
 * 保存完了後にもう一度保存する。
 */
async function persistStatuses(): Promise<void> {
  if (saveInProgress) {
    return;
  }

  if (!savePending) {
    return;
  }

  savePending = false;
  saveInProgress = true;

  try {
    const filePath = getStatusFilePath();

    await fs.ensureDir(path.dirname(filePath));

    await fs.writeJson(filePath, Object.fromEntries(memoryStatuses), {
      spaces: 2,
    });

    console.log(`[StatusManager] saved (${memoryStatuses.size})`);
  } catch (error) {
    console.error("[StatusManager] save failed:", error);

    // 保存失敗時は次回更新時に再保存できるようにする。
    savePending = true;
  } finally {
    saveInProgress = false;

    if (savePending && !saveTimer) {
      schedulePersistStatuses();
    }
  }
}

/**
 * 保留中のStatus保存を即時実行する。
 *
 * アプリ終了時など、保存待ちデータを確実に書き出したい
 * 場合に利用する。
 */
export async function flushStatusPersistence(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  await persistStatuses();
}

// ============================================================
// Cleanup
// ============================================================

async function cleanupOldStatusFiles(): Promise<void> {
  try {
    const dir = app.getPath("userData");
    const todaySuffix = getTodaySuffix();

    if (!(await fs.pathExists(dir))) {
      return;
    }

    const files = await fs.readdir(dir);

    const oldStatusFiles = files.filter(
      (file) =>
        file.startsWith("operationStatuses_") &&
        file.endsWith(".json") &&
        !file.includes(todaySuffix),
    );

    await Promise.all(
      oldStatusFiles.map((file) => fs.remove(path.join(dir, file))),
    );

    if (oldStatusFiles.length > 0) {
      console.log(
        `[StatusManager] cleanup old files: ${oldStatusFiles.length}`,
      );
    }
  } catch (error) {
    console.error("[StatusManager] cleanup failed:", error);
  }
}

// ============================================================
// Initialization
// ============================================================

export async function initializeStatuses(): Promise<
  Record<string, PersistedStatus>
> {
  await cleanupOldStatusFiles();

  memoryStatuses.clear();

  const filePath = getStatusFilePath();

  if (!(await fs.pathExists(filePath))) {
    console.log("[StatusManager] no saved status:", filePath);
    return {};
  }

  try {
    const data = (await fs.readJson(filePath)) as Record<
      string,
      PersistedStatus
    >;

    for (const [kanriNo, status] of Object.entries(data)) {
      memoryStatuses.set(String(kanriNo), normalizePersistedStatus(status));
    }

    console.log(`[StatusManager] loaded (${memoryStatuses.size}): ${filePath}`);

    return Object.fromEntries(memoryStatuses);
  } catch (error) {
    console.error("[StatusManager] load failed:", error);
    return {};
  }
}

// ============================================================
// Registration
// ============================================================

export function registerTargets(items: OperationItem[]): void {
  let changed = false;

  for (const item of items) {
    const key = String(item.kanriNo);

    if (!key || memoryStatuses.has(key)) {
      continue;
    }

    memoryStatuses.set(key, createPersistedStatus(item));
    changed = true;
  }

  if (changed) {
    schedulePersistStatuses();
  }
}

// ============================================================
// Read
// ============================================================

export function getStatus(
  kanriNo: string | number,
): PersistedStatus | undefined {
  return memoryStatuses.get(String(kanriNo));
}

export function getAllStatuses(): Array<PersistedStatus & { kanriNo: string }> {
  return [...memoryStatuses.entries()].map(([kanriNo, status]) => ({
    kanriNo,
    ...status,
  }));
}

// ============================================================
// Update
// ============================================================

export function updateStatus(update: StatusUpdate): boolean {
  const key = String(update.kanriNo);

  if (!key) {
    return false;
  }

  const previous = memoryStatuses.get(key);

  const next: PersistedStatus = {
    ...createEmptyStatus(),
    ...previous,
    ...pickStatusFields(update),
  };

  if (isSameStatus(previous, next)) {
    return false;
  }

  memoryStatuses.set(key, next);

  console.log(`[StatusManager] updated [${key}]`, {
    previous: previous?.status,
    next: next.status,
  });

  // Rendererへの通知は即時。
  broadcastStatusUpdate(key, next);

  // ファイル保存だけまとめる。
  schedulePersistStatuses();

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
}

// ============================================================
// Delete
// ============================================================

export async function deleteAllStatuses(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  savePending = false;

  memoryStatuses.clear();

  const filePath = getStatusFilePath();

  if (!(await fs.pathExists(filePath))) {
    return;
  }

  try {
    await fs.remove(filePath);

    console.log(`[StatusManager] deleted: ${filePath}`);
  } catch (error) {
    console.error("[StatusManager] delete failed:", error);
  }
}

// ============================================================
// IPC
// ============================================================

function broadcastStatusUpdate(kanriNo: string, status: PersistedStatus): void {
  const window = BrowserWindow.getAllWindows()[0];

  if (!window || window.isDestroyed()) {
    return;
  }

  window.webContents.send("operationStatusUpdated", {
    status: {
      kanriNo,
      ...status,
    },
  });
}

// ============================================================
// Helpers
// ============================================================

function createEmptyStatus(): PersistedStatus {
  return {
    status: "scheduled",
    comment: "",
    startTime: null,
    endTime: null,
    expectedStartTime: null,
    expectedEndTime: null,
    substatus: null,
    info: null,
  };
}

function createPersistedStatus(item: OperationItem): PersistedStatus {
  return {
    status: item.status ?? "scheduled",
    comment: item.comment ?? "",
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    expectedStartTime: item.expectedStartTime ?? null,
    expectedEndTime: item.expectedEndTime ?? null,
    substatus: item.substatus ?? null,
    info: item.info ?? null,
  };
}

function pickStatusFields(
  item: Pick<OperationItem, keyof PersistedStatus>,
): PersistedStatus {
  return {
    status: item.status ?? "scheduled",
    comment: item.comment ?? "",
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    expectedStartTime: item.expectedStartTime ?? null,
    expectedEndTime: item.expectedEndTime ?? null,
    substatus: item.substatus ?? null,
    info: item.info ?? null,
  };
}

function normalizePersistedStatus(status: PersistedStatus): PersistedStatus {
  return {
    status: status.status ?? "scheduled",
    comment: status.comment ?? "",
    startTime: status.startTime ?? null,
    endTime: status.endTime ?? null,
    expectedStartTime: status.expectedStartTime ?? null,
    expectedEndTime: status.expectedEndTime ?? null,
    substatus: status.substatus ?? null,
    info: status.info ?? null,
  };
}

function isSameStatus(
  previous: PersistedStatus | undefined,
  next: PersistedStatus,
): boolean {
  return JSON.stringify(previous) === JSON.stringify(next);
}
