// electron/features/operation/infrastructure/storage/activeFlagsStorage.ts

import fs from "fs-extra";
import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";
import {
  cleanupDatedFiles,
  getDatedFilePath,
  writeJsonSafely,
} from "./storageHelper";

export const ACTIVE_FLAGS_STORAGE_CONFIG = {
  filePrefix: "activeFlags_",
} as const;

const getFilePath = (): string =>
  getDatedFilePath(ACTIVE_FLAGS_STORAGE_CONFIG.filePrefix);

export async function loadActiveFlags(): Promise<ActiveFlags> {
  try {
    await cleanupDatedFiles(ACTIVE_FLAGS_STORAGE_CONFIG.filePrefix);

    const filePath = getFilePath();

    if (!(await fs.pathExists(filePath))) {
      return { ...DEFAULT_ACTIVE_FLAGS };
    }

    const saved = (await fs.readJson(filePath)) as Record<
      string,
      unknown
    > | null;

    const result: ActiveFlags = { ...DEFAULT_ACTIVE_FLAGS };

    for (const key of Object.keys(
      DEFAULT_ACTIVE_FLAGS,
    ) as (keyof ActiveFlags)[]) {
      if (typeof saved?.[key] === "boolean") {
        result[key] = saved[key] as ActiveFlags[typeof key];
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
    await writeJsonSafely(getFilePath(), flags);
  } catch (error) {
    console.error("[ActiveFlagsStorage] Write failed:", error);
    throw error;
  }
}
