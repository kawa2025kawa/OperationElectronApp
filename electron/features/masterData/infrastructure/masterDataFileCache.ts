// electron/features/masterData/infrastructure/masterDataFileCache.ts

import path from "node:path";
import Store from "electron-store";

interface VersionedCache<T> {
  version: number;
  fetchedAt: string;
  data: T;
}

type CacheStoreShape = {
  cache?: VersionedCache<unknown>;
};

function getCacheStore(fileName: string): Store<CacheStoreShape> {
  const storeName = path.basename(fileName, path.extname(fileName));
  return new Store<CacheStoreShape>({
    name: storeName,
    clearInvalidConfig: true,
  });
}

// バージョンとデータ検証関数を使ってキャッシュを読み込む。
export async function loadMasterDataFileCache<T>(
  fileName: string,
  version: number,
  isData: (value: unknown) => value is T,
): Promise<{ fetchedAt: string; data: T } | null> {
  try {
    const cache = getCacheStore(fileName).get("cache");

    if (
      !cache ||
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
  getCacheStore(fileName).set("cache", {
    version,
    fetchedAt: new Date().toISOString(),
    data,
  });
}

// キャッシュをクリアする。
export async function deleteMasterDataFileCache(
  fileName: string,
): Promise<void> {
  try {
    getCacheStore(fileName).clear();
  } catch {
    // 削除失敗は無視
  }
}