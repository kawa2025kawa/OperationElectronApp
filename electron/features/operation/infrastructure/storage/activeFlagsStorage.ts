// electron/features/operation/infrastructure/storage/activeFlagsStorage.ts

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";
import { cleanupDatedFiles, createDatedJsonStore } from "./storageHelper";

const ACTIVE_FLAGS_STORAGE_CONFIG = {
  filePrefix: "activeFlags_",
} as const;

type ActiveFlagsStoreData = Record<keyof ActiveFlags, boolean>;

const getStore = () =>
  createDatedJsonStore<ActiveFlagsStoreData>(
    ACTIVE_FLAGS_STORAGE_CONFIG.filePrefix,
    { ...DEFAULT_ACTIVE_FLAGS },
  );

export async function loadActiveFlags(): Promise<ActiveFlags> {
  try {
    await cleanupDatedFiles(ACTIVE_FLAGS_STORAGE_CONFIG.filePrefix);

    const saved = getStore().store;
    const result: ActiveFlags = { ...DEFAULT_ACTIVE_FLAGS };

    for (const key of Object.keys(
      DEFAULT_ACTIVE_FLAGS,
    ) as (keyof ActiveFlags)[]) {
      if (typeof saved?.[key] === "boolean") {
        result[key] = saved[key];
      }
    }

    return result;
  } catch (error) {
    console.error("[ActiveFlagsStorage] Read failed:", error);
    return { ...DEFAULT_ACTIVE_FLAGS };
  }
}

export async function persistActiveFlags(flags: ActiveFlags): Promise<void> {
  try {
    getStore().store = { ...flags };
  } catch (error) {
    console.error("[ActiveFlagsStorage] Write failed:", error);
    throw error;
  }
}