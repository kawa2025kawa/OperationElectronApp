// electron/features/operation/helpers/statusStorage.ts

import path from "node:path";
import { app } from "electron";
import { format } from "date-fns";
import fs from "fs-extra";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";

export type PersistedStatus = OperationStatusState;

const STATUS_FILE_PREFIX = "operationStatuses_";
const STATUS_SAVE_DEBOUNCE_MS = 300;

let saveTimer: NodeJS.Timeout | null = null;
let saveInProgress = false;
let savePending = false;

const getStatusFilePath = () =>
  path.join(
    app.getPath("userData"),
    `${STATUS_FILE_PREFIX}${format(new Date(), "yyyyMMdd")}.json`,
  );

/* ============================================================================
 * Save
 * ========================================================================== */

export function schedulePersistStatuses(
  memoryStatuses: Map<string, PersistedStatus>,
): void {
  savePending = true;
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveTimer = null;
    void persistStatuses(memoryStatuses);
  }, STATUS_SAVE_DEBOUNCE_MS);
}

async function persistStatuses(
  memoryStatuses: Map<string, PersistedStatus>,
): Promise<void> {
  if (saveInProgress || !savePending) return;

  savePending = false;
  saveInProgress = true;

  try {
    // userData は必ず存在するため ensureDir をカットし直接保存
    await fs.writeJson(
      getStatusFilePath(),
      Object.fromEntries(memoryStatuses),
      {
        spaces: 2,
      },
    );
  } catch (error) {
    console.error("[StatusStorage] save failed:", error);
    savePending = true;
  } finally {
    saveInProgress = false;
    if (savePending && !saveTimer) {
      schedulePersistStatuses(memoryStatuses);
    }
  }
}

/* ============================================================================
 * Load / Cleanup / Delete
 * ========================================================================== */

export async function loadStatusesFromFile(): Promise<
  Record<string, PersistedStatus>
> {
  await cleanupOldStatusFiles();
  const filePath = getStatusFilePath();

  try {
    return (await fs.readJson(filePath)) as Record<string, PersistedStatus>;
  } catch {
    return {};
  }
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
  } catch {}
}

export async function deleteStatusFile(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  savePending = false;
  await fs.remove(getStatusFilePath()).catch(() => {});
}
