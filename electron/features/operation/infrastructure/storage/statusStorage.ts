// electron/features/operation/infrastructure/storage/statusStorage.ts

import path from "node:path";
import { app } from "electron";
import { format } from "date-fns";
import fs from "fs-extra";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";

export type PersistedStatus = OperationStatusState;

const STATUS_FILE_PREFIX = "operationStatuses_";
const DEBOUNCE_DELAY_MS = 1000;

let persistTimer: NodeJS.Timeout | null = null;
let pendingMemoryStatuses: Map<string, PersistedStatus> | null = null;
let isWriting = false;

function getStatusFilePath(): string {
  return path.join(
    app.getPath("userData"),
    `${STATUS_FILE_PREFIX}${format(new Date(), "yyyyMMdd")}.json`,
  );
}

export async function persistStatusesImmediately(
  memoryStatuses: Map<string, PersistedStatus>,
): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  pendingMemoryStatuses = null;

  if (isWriting) {
    pendingMemoryStatuses = memoryStatuses;
    return;
  }

  isWriting = true;
  try {
    const filePath = getStatusFilePath();
    const data = Object.fromEntries(memoryStatuses);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, { spaces: 2 });
  } catch (error) {
    console.error("[StatusStorage] Immediate write failed:", error);
  } finally {
    isWriting = false;
    if (pendingMemoryStatuses !== null) {
      const nextStatuses = pendingMemoryStatuses;
      pendingMemoryStatuses = null;
      void persistStatusesImmediately(nextStatuses);
    }
  }
}

export function persistStatusesDebounced(
  memoryStatuses: Map<string, PersistedStatus>,
): void {
  pendingMemoryStatuses = memoryStatuses;

  if (persistTimer !== null) {
    return;
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (pendingMemoryStatuses !== null) {
      const targetStatuses = pendingMemoryStatuses;
      pendingMemoryStatuses = null;
      void persistStatusesImmediately(targetStatuses);
    }
  }, DEBOUNCE_DELAY_MS);
}

export async function loadStatusesFromFile(): Promise<
  Record<string, PersistedStatus>
> {
  await cleanupOldStatusFiles();

  const filePath = getStatusFilePath();

  try {
    if (await fs.pathExists(filePath)) {
      return (await fs.readJson(filePath)) as Record<string, PersistedStatus>;
    }
  } catch (error) {
    console.error("[StatusStorage] Read failed:", error);
  }

  return {};
}

async function cleanupOldStatusFiles(): Promise<void> {
  try {
    const dir = app.getPath("userData");
    const todaySuffix = format(new Date(), "yyyyMMdd");

    if (!(await fs.pathExists(dir))) {
      return;
    }

    const files = await fs.readdir(dir);
    const oldFiles = files.filter(
      (file) =>
        file.startsWith(STATUS_FILE_PREFIX) &&
        file.endsWith(".json") &&
        !file.includes(todaySuffix),
    );

    await Promise.all(oldFiles.map((file) => fs.remove(path.join(dir, file))));
  } catch {
    // クリーンアップ失敗はアプリ起動・動作を妨げない
  }
}

export async function deleteStatusFile(): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  pendingMemoryStatuses = null;

  try {
    await fs.remove(getStatusFilePath());
  } catch {
    // 削除失敗は無視
  }
}
