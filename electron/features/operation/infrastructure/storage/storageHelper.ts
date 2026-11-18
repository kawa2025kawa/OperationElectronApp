// electron/features/operation/infrastructure/storage/storageHelper.ts

import path from "node:path";
import { app } from "electron";
import { format } from "date-fns";
import fs from "fs-extra";
import Store, { type Options as StoreOptions } from "electron-store";

export const getDatedStoreName = (
  prefix: string,
  pattern = "yyyyMMdd",
): string => `${prefix}${format(new Date(), pattern)}`;

export async function cleanupDatedFiles(
  prefix: string,
  pattern = "yyyyMMdd",
): Promise<void> {
  try {
    const dir = app.getPath("userData");
    if (!(await fs.pathExists(dir))) return;

    const todaySuffix = format(new Date(), pattern);
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

export function createDatedJsonStore<T extends Record<string, unknown>>(
  prefix: string,
  defaults: StoreOptions<T>["defaults"],
  pattern = "yyyyMMdd",
): Store<T> {
  return new Store<T>({
    name: getDatedStoreName(prefix, pattern),
    defaults,
    clearInvalidConfig: true,
  });
}