// electron/features/operation/persistence/statusStorage.ts

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

function getStatusFilePath(): string {
  return path.join(
    app.getPath("userData"),
    `${STATUS_FILE_PREFIX}${format(new Date(), "yyyyMMdd")}.json`,
  );
}

export function persistStatusesImmediately(
  memoryStatuses: Map<string, PersistedStatus>,
): void {
  if (persistTimer) {
    clearTimeout(persistTimer);

    persistTimer = null;
  }

  try {
    const filePath = getStatusFilePath();

    const data = Object.fromEntries(memoryStatuses);

    fs.writeJsonSync(filePath, data, {
      spaces: 2,
    });
  } catch (error) {
    console.error("[StatusStorage] Immediate write failed:", error);
  } finally {
    pendingMemoryStatuses = null;
  }
}

export function persistStatusesDebounced(
  memoryStatuses: Map<string, PersistedStatus>,
): void {
  pendingMemoryStatuses = memoryStatuses;

  if (persistTimer) {
    return;
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;

    if (pendingMemoryStatuses) {
      persistStatusesImmediately(pendingMemoryStatuses);
    }
  }, DEBOUNCE_DELAY_MS);
}

export async function loadStatusesFromFile(): Promise<
  Record<string, PersistedStatus>
> {
  await cleanupOldStatusFiles();

  const filePath = getStatusFilePath();

  try {
    if (fs.existsSync(filePath)) {
      return fs.readJsonSync(filePath) as Record<string, PersistedStatus>;
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

    const files = await fs.readdir(dir);

    const oldFiles = files.filter(
      (file) =>
        file.startsWith(STATUS_FILE_PREFIX) &&
        file.endsWith(".json") &&
        !file.includes(todaySuffix),
    );

    await Promise.all(oldFiles.map((file) => fs.remove(path.join(dir, file))));
  } catch {
    // Cleanup failure does not block application startup.
  }
}

export async function deleteStatusFile(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer);

    persistTimer = null;
  }

  pendingMemoryStatuses = null;

  await fs.remove(getStatusFilePath()).catch(() => {});
}
