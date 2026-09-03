// electron/features/operation/helpers/statusStorage.ts
import path from "node:path";
import { app } from "electron";
import { format } from "date-fns";
import fs from "fs-extra";
import type { OperationStatusFields } from "@shared/types/operation";

export type PersistedStatus = OperationStatusFields;

const STATUS_SAVE_DEBOUNCE_MS = 300;
let saveTimer: NodeJS.Timeout | null = null;
let saveInProgress = false;
let savePending = false;

function getTodaySuffix(): string {
  return format(new Date(), "yyyyMMdd");
}

function getStatusFilePath(): string {
  return path.join(
    app.getPath("userData"),
    `operationStatuses_${getTodaySuffix()}.json`,
  );
}

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
    const filePath = getStatusFilePath();
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, Object.fromEntries(memoryStatuses), {
      spaces: 2,
    });
    console.log(`[StatusStorage] saved (${memoryStatuses.size})`);
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

async function flushStatusPersistence(
  memoryStatuses: Map<string, PersistedStatus>,
): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await persistStatuses(memoryStatuses);
}

async function cleanupOldStatusFiles(): Promise<void> {
  try {
    const dir = app.getPath("userData");
    const todaySuffix = getTodaySuffix();
    if (!(await fs.pathExists(dir))) return;
    const files = await fs.readdir(dir);
    const oldFiles = files.filter(
      (f) =>
        f.startsWith("operationStatuses_") &&
        f.endsWith(".json") &&
        !f.includes(todaySuffix),
    );
    await Promise.all(oldFiles.map((f) => fs.remove(path.join(dir, f))));
    if (oldFiles.length > 0) {
      console.log(
        `[StatusStorage] cleanup old files count: ${oldFiles.length}`,
      );
    }
  } catch (error) {
    console.error("[StatusStorage] cleanup failed:", error);
  }
}

export async function loadStatusesFromFile(): Promise<
  Record<string, PersistedStatus>
> {
  await cleanupOldStatusFiles();
  const filePath = getStatusFilePath();
  if (!(await fs.pathExists(filePath))) return {};
  try {
    return (await fs.readJson(filePath)) as Record<string, PersistedStatus>;
  } catch (error) {
    console.error("[StatusStorage] load failed:", error);
    return {};
  }
}

export async function deleteStatusFile(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  savePending = false;
  const filePath = getStatusFilePath();
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
  }
}
