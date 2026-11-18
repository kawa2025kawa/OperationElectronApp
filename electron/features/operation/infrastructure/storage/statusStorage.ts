// electron/features/operation/infrastructure/storage/statusStorage.ts

import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import { cleanupDatedFiles, createDatedJsonStore } from "./storageHelper";

export type PersistedStatus = OperationStatusState;

const STATUS_STORAGE_CONFIG = {
  filePrefix: "operationStatuses_",
  dateFormatPattern: "yyyyMMdd",
  debounceDelayMs: 1000,
} as const;

let persistTimer: NodeJS.Timeout | null = null;
let pendingStatuses: Map<string, PersistedStatus> | null = null;

const getStore = () =>
  createDatedJsonStore<Record<string, PersistedStatus>>(
    STATUS_STORAGE_CONFIG.filePrefix,
    {},
    STATUS_STORAGE_CONFIG.dateFormatPattern,
  );

export async function persistStatusesImmediately(
  memoryStatuses: Map<string, PersistedStatus>,
): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  pendingStatuses = null;

  try {
    getStore().store = Object.fromEntries(memoryStatuses);
  } catch (error) {
    console.error("[StatusStorage] Immediate write failed:", error);
  }
}

export function persistStatusesDebounced(
  memoryStatuses: Map<string, PersistedStatus>,
): void {
  pendingStatuses = memoryStatuses;
  if (persistTimer !== null) return;

  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (pendingStatuses !== null) {
      const target = pendingStatuses;
      pendingStatuses = null;
      void persistStatusesImmediately(target);
    }
  }, STATUS_STORAGE_CONFIG.debounceDelayMs);
}

export async function loadStatusesFromFile(): Promise<
  Record<string, PersistedStatus>
> {
  await cleanupDatedFiles(
    STATUS_STORAGE_CONFIG.filePrefix,
    STATUS_STORAGE_CONFIG.dateFormatPattern,
  );

  try {
    return { ...getStore().store };
  } catch (error) {
    console.error("[StatusStorage] Read failed:", error);
    return {};
  }
}

export async function deleteStatusFile(): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  pendingStatuses = null;
  try {
    getStore().clear();
  } catch {
    // 削除失敗は無視
  }
}