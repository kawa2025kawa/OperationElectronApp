// electron/features/operation/infrastructure/operationStorage.ts

import path from "node:path";
import { app } from "electron";
import { format } from "date-fns";
import fs from "fs-extra";
import Store, { type Options as StoreOptions, type Schema } from "electron-store";
import { DEFAULT_ACTIVE_FLAGS } from "@electron/features/operation/application/statusState";
import type {
  ActiveFlags,
  OperationStatusState,
} from "@shared/types/operation/operationTypes";

const ACTIVE_FLAGS_PREFIX = "activeFlags_";
const STATUS_FILE_PREFIX = "operationStatuses_";
const DATE_PATTERN = "yyyyMMdd";
const PERSIST_DEBOUNCE_MS = 1000;

const ACTIVE_FLAGS_SCHEMA: Schema<Record<keyof ActiveFlags, boolean>> = {
  is1CActive: { type: "boolean", default: false },
  is2CActive: { type: "boolean", default: false },
  is3CActive: { type: "boolean", default: false },
};

let persistTimer: NodeJS.Timeout | null = null;
let pendingStatuses: Map<string, OperationStatusState> | null = null;

async function cleanupDatedFiles(prefix: string): Promise<void> {
  try {
    const dir = app.getPath("userData");
    if (!(await fs.pathExists(dir))) return;

    const todaySuffix = format(new Date(), DATE_PATTERN);
    const files = await fs.readdir(dir);
    const oldFiles = files.filter(
      (f) =>
        f.startsWith(prefix) && f.endsWith(".json") && !f.includes(todaySuffix),
    );
    await Promise.all(oldFiles.map((f) => fs.remove(path.join(dir, f))));
  } catch {
    // クリーンアップ失敗はアプリ動作を妨げない
  }
}

function createDatedJsonStore<T extends Record<string, unknown>>(
  prefix: string,
  defaults: StoreOptions<T>["defaults"],
  schema?: Schema<T>,
): Store<T> {
  return new Store<T>({
    name: `${prefix}${format(new Date(), DATE_PATTERN)}`,
    defaults,
    schema,
    clearInvalidConfig: true,
  });
}

const getActiveFlagsStore = () =>
  createDatedJsonStore<Record<keyof ActiveFlags, boolean>>(
    ACTIVE_FLAGS_PREFIX,
    { ...DEFAULT_ACTIVE_FLAGS },
    ACTIVE_FLAGS_SCHEMA,
  );

const getStatusStore = () =>
  createDatedJsonStore<Record<string, OperationStatusState>>(
    STATUS_FILE_PREFIX,
    {},
  );

export async function loadActiveFlags(): Promise<ActiveFlags> {
  try {
    await cleanupDatedFiles(ACTIVE_FLAGS_PREFIX);

    const saved = getActiveFlagsStore().store;
    return {
      is1CActive: Boolean(saved?.is1CActive),
      is2CActive: Boolean(saved?.is2CActive),
      is3CActive: Boolean(saved?.is3CActive),
    };
  } catch (error) {
    console.error("[ActiveFlagsStorage] Read failed:", error);
    return { ...DEFAULT_ACTIVE_FLAGS };
  }
}

export async function persistActiveFlags(flags: ActiveFlags): Promise<void> {
  try {
    getActiveFlagsStore().store = { ...flags };
  } catch (error) {
    console.error("[ActiveFlagsStorage] Write failed:", error);
    throw error;
  }
}

export async function persistStatusesImmediately(
  memoryStatuses: Map<string, OperationStatusState>,
): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  pendingStatuses = null;

  try {
    getStatusStore().store = Object.fromEntries(memoryStatuses);
  } catch (error) {
    console.error("[StatusStorage] Immediate write failed:", error);
  }
}

export function persistStatusesDebounced(
  memoryStatuses: Map<string, OperationStatusState>,
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
  }, PERSIST_DEBOUNCE_MS);
}

/** 保留中のデバウンス書き込みを即座にフラッシュし、タイマーを破棄する */
export async function flushPendingStatuses(): Promise<void> {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  if (pendingStatuses !== null) {
    const target = pendingStatuses;
    pendingStatuses = null;
    await persistStatusesImmediately(target);
  }
}

export async function loadStatusesFromFile(): Promise<
  Record<string, OperationStatusState>
> {
  await cleanupDatedFiles(STATUS_FILE_PREFIX);

  try {
    return { ...getStatusStore().store };
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
    getStatusStore().clear();
  } catch {
    // 削除失敗は無視
  }
}
