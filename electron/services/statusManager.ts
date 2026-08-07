import fs from "fs-extra";
import path from "node:path";
import { app, BrowserWindow } from "electron";
import { format } from "date-fns";
import type { OperationItem, JobStatus } from "@shared/types/operationType";

const memoryStatuses: Map<string, OperationItem> = new Map();

function getStatusFilePath(): string {
  const todayStr = format(new Date(), "yyyyMMdd");
  return path.join(app.getPath("userData"), `operationStatuses_${todayStr}.json`);
}

async function cleanupOldStatusFiles(): Promise<void> {
  try {
    const dir = app.getPath("userData");
    const todaySuffix = format(new Date(), "yyyyMMdd");
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.startsWith("operationStatuses_") && file.endsWith(".json") && !file.includes(todaySuffix)) {
        await fs.remove(path.join(dir, file));
      }
    }
  } catch (err) {
    console.error("[StatusManager] Cleanup failed:", err);
  }
}

async function persistStatuses(): Promise<void> {
  const obj = Object.fromEntries(memoryStatuses);
  await fs.writeJson(getStatusFilePath(), obj, { spaces: 2 });
}

export function broadcastStatusUpdate(item: OperationItem): void {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("operationStatusUpdated", { status: item });
  }
}

export async function initializeStatuses(): Promise<Record<string, OperationItem>> {
  await cleanupOldStatusFiles();
  memoryStatuses.clear();
  const filePath = getStatusFilePath();
  if (await fs.pathExists(filePath)) {
    const data = (await fs.readJson(filePath)) as Record<string, OperationItem>;
    Object.entries(data).forEach(([k, v]) => memoryStatuses.set(k, v));
    return data;
  }
  return {};
}

export function registerTargets(items: OperationItem[]): void {
  for (const item of items) {
    if (!item.status) {
      item.status = "scheduled";
    }
    if (!memoryStatuses.has(item.kanriNo)) {
      memoryStatuses.set(item.kanriNo, structuredClone(item));
    }
  }
  void persistStatuses();
}

export function getStatus(kanriNo: string): OperationItem | undefined {
  return memoryStatuses.get(kanriNo);
}

export function getAllStatuses(): OperationItem[] {
  return Array.from(memoryStatuses.values());
}

export function updateStatus(item: OperationItem): boolean {
  const current = memoryStatuses.get(item.kanriNo);
  const merged = { ...(current ?? {}), ...item };

  if (current && JSON.stringify(current) === JSON.stringify(merged)) {
    return false;
  }

  memoryStatuses.set(item.kanriNo, merged);
  broadcastStatusUpdate(merged);
  void persistStatuses();
  return true;
}

export function updateManualStatus(kanriNo: string, status: JobStatus, comment: string): void {
  const current = memoryStatuses.get(kanriNo) || ({ kanriNo, workName: "" } as OperationItem);
  updateStatus({
    ...current,
    status,
    comment,
    endTime: new Date().toISOString(),
  });
}

export async function deleteAllStatuses(): Promise<void> {
  memoryStatuses.clear();
  const filePath = getStatusFilePath();
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
  }
}
