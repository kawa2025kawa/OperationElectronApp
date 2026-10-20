// src/renderer/store/slices/initSlice.ts

import type { StateCreator } from "zustand";

import { appService } from "@renderer/services/appService";
import type { AppState } from "@renderer/store";
import { setupInitIpcListeners } from "@renderer/store/listeners/initIpcListeners";

import {
  INITIAL_INIT_STATUS,
  type InitStatus,
} from "@shared/types/initializationTypes";

/* =========================
 * Constants
 * ========================= */

const APP_LOADER_DELAY_MS = 2000;

/* =========================
 * State
 * ========================= */

let loaderTimeoutId: number | null = null;

const DATA_LOADING_STATUS: InitStatus = {
  update: "LOADING",
  operation: "LOADING",
  irregular: "LOADING",
  auth: "LOADING",
  store: "LOADING",
  jugyoin: "LOADING",
  kokyuhyo: "LOADING",
  tantou: "LOADING",
};

/* =========================
 * Initialization Helpers
 * ========================= */

// 初期化ステータスの値が完了（OK/NG/CONNECTED）状態か判定する。
const isSettledStatus = (value: unknown): boolean => {
  return value === "OK" || value === "NG" || value === "CONNECTED";
};

// すべての初期化項目が確定状態になっているかを判定する。
const isInitStatusSettled = (status: InitStatus): boolean => {
  return Object.values(status).every(isSettledStatus);
};

// 未完了状態の初期化項目をNGステータスとして抽出する。
const getUnsettledStatus = (status: InitStatus): Partial<InitStatus> => {
  return Object.fromEntries(
    Object.entries(status)
      .filter(([, value]) => !isSettledStatus(value))
      .map(([key]) => [key, "NG"]),
  ) as Partial<InitStatus>;
};

// ローダー非表示タイマーを破棄してクリアする。
const clearLoaderTimeout = (): void => {
  if (loaderTimeoutId === null) {
    return;
  }

  window.clearTimeout(loaderTimeoutId);
  loaderTimeoutId = null;
};

/* =========================
 * Slice
 * ========================= */

export interface InitSlice {
  isInitialLoaded: boolean;
  isInitializing: boolean;
  showAppLoader: boolean;
  initStatus: InitStatus;

  setInitStatus(
    update:
      | Partial<InitStatus>
      | ((prev: InitStatus) => Partial<InitStatus> | void),
  ): void;

  initializeApp(): Promise<void>;
}

// アプリケーション起動時の初期化およびローディング状態を管理するスライスを生成する。
export const createInitSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  InitSlice
> = (set, get) => {
  /* =========================
   * Loader
   * ========================= */

  // 初期化完了後に遅延を入れてローダー画面を非表示にするタイマーを予約する。
  const scheduleLoaderClose = (): void => {
    const { initStatus, isInitialLoaded, showAppLoader } = get();

    if (
      !isInitStatusSettled(initStatus) ||
      isInitialLoaded ||
      !showAppLoader ||
      loaderTimeoutId !== null
    ) {
      return;
    }

    loaderTimeoutId = window.setTimeout(() => {
      loaderTimeoutId = null;

      set((state) => {
        state.isInitialLoaded = true;
        state.showAppLoader = false;
      });
    }, APP_LOADER_DELAY_MS);
  };

  /* =========================
   * Initialization Completion
   * ========================= */

  // 全項目の初期化完了を確認しローダーの終了をスケジュールする。
  const markInitializationCompleted = (): void => {
    const { initStatus } = get();

    if (!isInitStatusSettled(initStatus)) {
      console.warn(
        "[InitSlice] Initialization completion requested before all startup tasks settled.",
        initStatus,
      );

      return;
    }

    scheduleLoaderClose();
  };

  // 初期化失敗時に未完了項目をNGとし未認証状態へフォールバックする。
  const markInitializationFailed = (error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error);

    console.error("[InitSlice] Failed to initialize app:", message);

    const failed = getUnsettledStatus(get().initStatus);

    set((state) => {
      state.isAuthenticated = false;
    });

    get().setInitStatus(failed);
  };

  /* =========================
   * Public API
   * ========================= */

  return {
    isInitialLoaded: false,

    isInitializing: false,

    showAppLoader: true,

    initStatus: INITIAL_INIT_STATUS,

    /* =========================
     * Initialization Status
     * ========================= */

    // 各機能の初期化状態を更新し、完了状況に応じてローダー表示を制御する。
    setInitStatus: (update) => {
      set((state) => {
        const next =
          typeof update === "function" ? update(state.initStatus) : update;

        if (next) {
          Object.assign(state.initStatus, next);
        }
      });

      if (isInitStatusSettled(get().initStatus)) {
        scheduleLoaderClose();
      } else {
        clearLoaderTimeout();
      }
    },

    /* =========================
     * Application Initialization
     * ========================= */

    // IPCリスナー登録とアプリ初期マスタデータのロードを実行する。
    initializeApp: async () => {
      const { isInitializing, isInitialLoaded } = get();

      if (isInitializing || isInitialLoaded) {
        return;
      }

      clearLoaderTimeout();

      set((state) => {
        state.isInitializing = true;
        state.isInitialLoaded = false;
        state.showAppLoader = true;
        state.initStatus = {
          ...DATA_LOADING_STATUS,
        };
      });

      try {
        setupInitIpcListeners(get);

        await appService.initializeAppData();

        markInitializationCompleted();
      } catch (error) {
        markInitializationFailed(error);
      } finally {
        set((state) => {
          state.isInitializing = false;
        });
      }
    },
  };
};
