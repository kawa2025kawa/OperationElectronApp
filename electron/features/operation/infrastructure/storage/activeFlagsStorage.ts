// electron/features/operation/infrastructure/storage/activeFlagsStorage.ts

import path from "node:path";
import { app } from "electron";
import fs from "fs-extra";

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";
import { getDateKey } from "@electron/features/operation/jobs/scripts/helpers/timeUtils";

const ACTIVE_FLAGS_FILE_PREFIX = "activeFlags_";

function getActiveFlagsFilePath(): string {
  const today = getDateKey();
  return path.join(
    app.getPath("userData"),
    `${ACTIVE_FLAGS_FILE_PREFIX}${today}.json`,
  );
}

async function cleanupOldActiveFlagsFiles(): Promise<void> {
  try {
    const dir = app.getPath("userData");
    if (!(await fs.pathExists(dir))) return;

    const todaySuffix = getDateKey();
    const files = await fs.readdir(dir);

    const oldFiles = files.filter(
      (file) =>
        file.startsWith(ACTIVE_FLAGS_FILE_PREFIX) &&
        file.endsWith(".json") &&
        !file.includes(todaySuffix),
    );

    await Promise.all(oldFiles.map((file) => fs.remove(path.join(dir, file))));
  } catch {
    // クリーンアップ失敗はアプリ動作を妨げない
  }
}

/**
 * 保存ファイルからセンターフラグを読み込む。
 * DEFAULT_ACTIVE_FLAGS の定義に基づいて動的マッピングするため、
 * フラグの追加・削除・キー変更時もこの関数側の手直しは不要。
 */
export function loadActiveFlags(): ActiveFlags {
  void cleanupOldActiveFlagsFiles();

  try {
    const filePath = getActiveFlagsFilePath();

    if (!fs.existsSync(filePath)) {
      return { ...DEFAULT_ACTIVE_FLAGS };
    }

    const saved = (fs.readJsonSync(filePath) as Record<string, unknown>) ?? {};
    const result: ActiveFlags = { ...DEFAULT_ACTIVE_FLAGS };

    // DEFAULT_ACTIVE_FLAGS のキー定義を自動走査して適用
    for (const key of Object.keys(
      DEFAULT_ACTIVE_FLAGS,
    ) as (keyof ActiveFlags)[]) {
      if (typeof saved[key] === "boolean") {
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
    const filePath = getActiveFlagsFilePath();
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, flags, { spaces: 2 });
  } catch (error) {
    console.error("[ActiveFlagsStorage] Write failed:", error);
    throw error;
  }
}
