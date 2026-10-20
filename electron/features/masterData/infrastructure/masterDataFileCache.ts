// electron/features/masterData/infrastructure/masterDataFileCache.ts

import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";

// ファイルキャッシュの共通形式。
interface VersionedCache<T> {
  version: number;
  fetchedAt: string;
  data: T;
}

// キャッシュファイルのパスを取得する。
function getFilePath(fileName: string): string {
  return path.join(app.getPath("userData"), fileName);
}

// バージョンとデータ検証関数を使ってキャッシュを読み込む。
export async function loadMasterDataFileCache<T>(
  fileName: string,
  version: number,
  isData: (value: unknown) => value is T,
): Promise<{ fetchedAt: string; data: T } | null> {
  try {
    const json = await fs.readFile(getFilePath(fileName), "utf8");
    const parsed: unknown = JSON.parse(json);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const cache = parsed as Record<string, unknown>;

    if (
      cache.version !== version ||
      typeof cache.fetchedAt !== "string" ||
      !isData(cache.data)
    ) {
      return null;
    }

    return {
      fetchedAt: cache.fetchedAt,
      data: cache.data,
    };
  } catch {
    return null;
  }
}

// 取得日時とデータをバージョン付きでファイルへ保存する。
export async function saveMasterDataFileCache<T>(
  fileName: string,
  version: number,
  data: T,
): Promise<void> {
  const filePath = getFilePath(fileName);

  const cache: VersionedCache<T> = {
    version,
    fetchedAt: new Date().toISOString(),
    data,
  };

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2), "utf8");
}

// キャッシュファイルを削除する。ファイルがなければ何もしない。
export async function deleteMasterDataFileCache(
  fileName: string,
): Promise<void> {
  try {
    await fs.unlink(getFilePath(fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
