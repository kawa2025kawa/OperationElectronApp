// electron/features/masterData/application/masterDataCacheService.ts

import { isSameJstDay } from "./jstDate";

// メモリーキャッシュの操作をまとめた設定。
export interface MasterDataCacheServiceOptions<T> {
  loadFreshData: () => Promise<T>;
  shouldCache?: (data: T) => boolean;
  logPrefix: string;
}

interface MemoryCache<T> {
  data: T;
  fetchedAt: string;
}

// マスターデータの取得・更新・削除を共通管理する（アプリ起動ごとに最新を取得し、同一セッション内のみメモリー保持）。
export function createMasterDataCacheService<T>(
  options: MasterDataCacheServiceOptions<T>,
) {
  let memoryCache: MemoryCache<T> | null = null;

  let refreshPromise: Promise<T> | null = null;
  let clearPromise: Promise<void> | null = null;

  // 最新データを取得して、キャッシュ可能な場合だけメモリーに保存する。
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

        if (options.shouldCache?.(data) === false) {
          memoryCache = null;
          return data;
        }

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

  // 有効なメモリーキャッシュを確認してマスターデータを返す。
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

      return refresh();
    }
  }

  // 実行中の更新完了を待って、メモリーキャッシュを削除する。
  async function clear(): Promise<void> {
    if (clearPromise) {
      return clearPromise;
    }

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
