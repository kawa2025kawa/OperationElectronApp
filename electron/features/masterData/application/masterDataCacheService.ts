// electron/features/masterData/application/masterDataCacheService.ts

import { isSameJstDay } from "./jstDate";

// メモリー・ディスクキャッシュの操作をまとめた設定。
export interface MasterDataCacheServiceOptions<T> {
  loadCache: () => Promise<{ fetchedAt: string; data: T } | null>;
  saveCache: (data: T) => Promise<void>;
  deleteCache: () => Promise<void>;
  loadFreshData: () => Promise<T>;
  logPrefix: string;
}

interface MemoryCache<T> {
  data: T;
  fetchedAt: string;
}

// マスターデータの取得・更新・削除を共通管理する。
export function createMasterDataCacheService<T>(
  options: MasterDataCacheServiceOptions<T>,
) {
  let memoryCache: MemoryCache<T> | null = null;

  let refreshPromise: Promise<T> | null = null;
  let clearPromise: Promise<void> | null = null;
  let cacheGeneration = 0;

  // 最新データを取得してディスク・メモリーキャッシュを更新する。
  async function refresh(): Promise<T> {
    while (true) {
      const pendingClear = clearPromise;

      if (pendingClear) {
        await pendingClear;
        continue;
      }

      if (refreshPromise) {
        return refreshPromise;
      }

      const currentRefresh = (async () => {
        const data = await options.loadFreshData();

        await options.saveCache(data);

        memoryCache = {
          data,
          fetchedAt: new Date().toISOString(),
        };

        return data;
      })();

      refreshPromise = currentRefresh;

      try {
        return await currentRefresh;
      } catch (err) {
        console.error(`${options.logPrefix} 更新に失敗:`, err);
        throw err;
      } finally {
        if (refreshPromise === currentRefresh) {
          refreshPromise = null;
        }
      }
    }
  }

  // 有効なメモリー・ディスクキャッシュを確認してマスターデータを返す。
  async function get(): Promise<T> {
    while (true) {
      const pendingClear = clearPromise;

      if (pendingClear) {
        await pendingClear;
        continue;
      }

      if (memoryCache !== null && isSameJstDay(memoryCache.fetchedAt)) {
        return memoryCache.data;
      }

      const generationAtReadStart = cacheGeneration;
      const cached = await options.loadCache();

      if (generationAtReadStart !== cacheGeneration) {
        continue;
      }

      if (cached && isSameJstDay(cached.fetchedAt)) {
        memoryCache = {
          data: cached.data,
          fetchedAt: cached.fetchedAt,
        };

        return cached.data;
      }

      return refresh();
    }
  }

  // 実行中の更新完了を待って、メモリー・ディスクキャッシュを削除する。
  async function clear(): Promise<void> {
    if (clearPromise) {
      return clearPromise;
    }

    cacheGeneration += 1;

    const pendingRefresh = refreshPromise;

    const currentClear = (async () => {
      if (pendingRefresh) {
        try {
          await pendingRefresh;
        } catch {
          // 更新失敗後も削除を続行する。
        }
      }

      memoryCache = null;

      await options.deleteCache();
    })();

    clearPromise = currentClear;

    try {
      await currentClear;
    } finally {
      if (clearPromise === currentClear) {
        clearPromise = null;
      }
    }
  }

  return {
    get,
    clear,
  };
}
