// electron/features/operation/infrastructure/storage/storageHelper.ts

import path from "node:path";
import { app } from "electron";
import { format } from "date-fns";
import fs from "fs-extra";

export const getDatedFilePath = (
  prefix: string,
  pattern = "yyyyMMdd",
): string =>
  path.join(
    app.getPath("userData"),
    `${prefix}${format(new Date(), pattern)}.json`,
  );

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

export async function writeJsonSafely(
  filePath: string,
  data: unknown,
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}
