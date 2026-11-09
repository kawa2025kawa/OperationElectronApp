// electron/features/operation/infrastructure/storage/statusStorage.ts

import fs from "fs-extra";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";
import {
  cleanupDatedFiles,
  getDatedFilePath,
  writeJsonSafely,
} from "./storageHelper";

export type PersistedStatus = OperationStatusState;

const STATUS_STORAGE_CONFIG = {
  filePrefix: "operationStatuses_",
  dateFormatPattern: "yyyyMMdd",
  debounceDelayMs: 1000,
} as const;

let persistTimer: NodeJS.Timeout | null = null;
let pendingStatuses: Map<string, PersistedStatus> | null = null;
let isWriting = false;

const getFilePath = (): string =>
  getDatedFilePath(
    STATUS_STORAGE_CONFIG.filePrefix,
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

  if (isWriting) {
    pendingStatuses = memoryStatuses;
    return;
  }

  isWriting = true;
  try {
    await writeJsonSafely(getFilePath(), Object.fromEntries(memoryStatuses));
  } catch (error) {
    console.error("[StatusStorage] Immediate write failed:", error);
  } finally {
    isWriting = false;
    if (pendingStatuses !== null) {
      const next = pendingStatuses;
      pendingStatuses = null;
      void persistStatusesImmediately(next);
    }
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
  const filePath = getFilePath();
  try {
    if (await fs.pathExists(filePath)) {
      return (await fs.readJson(filePath)) as Record<string, PersistedStatus>;
    }
  } catch (error) {
    console.error("[StatusStorage] Read failed:", error);
  }
  return {};
}

export async function deleteStatusFile(): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  pendingStatuses = null;
  try {
    await fs.remove(getFilePath());
  } catch {
    // 削除失敗は無視
  }
}
