// src/renderer/store/slices/initSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { INITIAL_INIT_STATUS, type InitStatus } from "@shared/types/system";
import { appService } from "@renderer/services/appService";
import { commands } from "@renderer/services/commands";
import { updateEntityInState } from "@renderer/features/operation/helpers/operationEntities";
import { handleStatusToastNotification } from "@renderer/components/ui/toast/statusToastHandler";

export interface InitSlice {
  isInitialLoaded: boolean;
  isInitializing: boolean;
  showAppLoader: boolean;
  initStatus: InitStatus;
  isIpcListenersSetup: boolean;
  setIsInitialLoaded: (isInitialLoaded: boolean) => void;
  setShowAppLoader: (show: boolean) => void;
  setInitStatus: (
    update:
      | Partial<InitStatus>
      | ((prev: InitStatus) => Partial<InitStatus> | void),
  ) => void;
  setupIpcListeners: () => void;
  initializeApp: () => Promise<void>;
}

// HMR/再読み込み時に重複登録を防ぐためのモジュールスコープ・クリーンアップ保持
let cleanupIpcListeners: (() => void) | null = null;

export const createInitSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  InitSlice
> = (set, get) => ({
  isInitialLoaded: false,
  isInitializing: false,
  showAppLoader: true,
  initStatus: INITIAL_INIT_STATUS,
  isIpcListenersSetup: false,

  setIsInitialLoaded: (isInitialLoaded) =>
    set((state) => {
      state.isInitialLoaded = isInitialLoaded;
    }),

  setShowAppLoader: (show) =>
    set((state) => {
      state.showAppLoader = show;
    }),

  setInitStatus: (update) =>
    set((state) => {
      const next =
        typeof update === "function" ? update(state.initStatus) : update;
      if (next) {
        Object.assign(state.initStatus, next);
      }
    }),

  /**
   * Mainプロセスからの IPC イベントを一括購読（Store主導で1度だけ実行）
   */
  setupIpcListeners: () => {
    if (get().isIpcListenersSetup) return;

    // 既存のリスナーが存在する場合はクリーンアップを実行
    if (cleanupIpcListeners) {
      cleanupIpcListeners();
      cleanupIpcListeners = null;
    }

    set((state) => {
      state.isIpcListenersSetup = true;
    });

    // 1. テーマ変更検知
    const unbindTheme = commands.onThemeChanged((theme) => {
      get().setTheme?.(theme);
    });

    // 2. ステータス更新検知 (State更新 & トースト通知)
    const unbindStatus = commands.onOperationStatusUpdated((update) => {
      set((state) => {
        updateEntityInState(state, update);
      });

      handleStatusToastNotification(update);
    });

    // 3. ポーリング1サイクル完了検知
    const unbindPolling = commands.onPollingCycleComplete(() => {
      get().updateLastPollTime?.();
    });

    // アンサブスクライブ関数をまとめて保持 (返り値がある場合に対応)
    cleanupIpcListeners = () => {
      if (typeof unbindTheme === "function") unbindTheme();
      if (typeof unbindStatus === "function") unbindStatus();
      if (typeof unbindPolling === "function") unbindPolling();
    };
  },

  initializeApp: async () => {
    if (get().isInitializing || get().isInitialLoaded) return;

    set((state) => {
      state.isInitializing = true;
    });

    try {
      get().setupIpcListeners();
      await appService.initializeApp();

      set((state) => {
        state.isInitialLoaded = true;
      });
    } catch (error) {
      console.error("[InitSlice] Failed to initialize app:", error);
    } finally {
      set((state) => {
        state.isInitializing = false;
      });
    }
  },
});
