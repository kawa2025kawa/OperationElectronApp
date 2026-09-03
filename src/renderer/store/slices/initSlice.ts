// src/renderer/store/slices/initSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { INITIAL_INIT_STATUS, type InitStatus } from "@shared/types/system";
import { appService } from "@renderer/services/appService";
import { commands } from "@renderer/services/commands";
import {
  evaluateDependenciesCascade,
  updateEntityInState,
} from "@renderer/features/operation/helpers/operationEntities";
import { refreshSummary } from "@renderer/features/operation/services/operationServices";
import { handleStatusToastNotification } from "@renderer/components/ui/toast/statusToastHandler";

const APP_LOADER_DELAY_MS = 2000;

export const DATA_LOADING_STATUS: InitStatus = {
  update: "LOADING",
  operation: "LOADING",
  irregular: "LOADING",
  auth: "LOADING",
  store: "LOADING",
  jugyoin: "LOADING",
  kokyuhyo: "LOADING",
  tantou: "LOADING",
};

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
  markInitializationCompleted: () => void;
  markInitializationFailed: (error: unknown) => void;
  setupIpcListeners: () => void;
  initializeApp: () => Promise<void>;
}

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

  /** 初期化成功時の完了処理（タイマー含む） */
  markInitializationCompleted: () => {
    set((state) => {
      state.initStatus.operation = "OK";
      state.initStatus.irregular = "OK";
      state.isInitialLoaded = true;
    });

    get().recalculateSummary?.();

    window.setTimeout(() => {
      set((state) => {
        state.showAppLoader = false;
      });
    }, APP_LOADER_DELAY_MS);
  },

  /** 初期化失敗時の状態リカバリー */
  markInitializationFailed: (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[InitSlice] Failed to initialize app:", message);

    set((state) => {
      state.isAuthenticated = false;
      state.accessToken = null;

      Object.keys(state.initStatus).forEach((key) => {
        const k = key as keyof InitStatus;
        const val = state.initStatus[k];
        if (val !== "OK" && val !== "CONNECTED") {
          state.initStatus[k] = "NG";
        }
      });
    });
  },

  setupIpcListeners: () => {
    if (get().isIpcListenersSetup) return;

    if (cleanupIpcListeners) {
      cleanupIpcListeners();
      cleanupIpcListeners = null;
    }

    set((state) => {
      state.isIpcListenersSetup = true;
    });

    const unbindTheme = commands.onThemeChanged((theme) => {
      get().setTheme?.(theme);
    });

    const unbindStatus = commands.onOperationStatusUpdated((update) => {
      set((state) => {
        updateEntityInState(state, update);
        evaluateDependenciesCascade(state);
        refreshSummary(state);
      });
      handleStatusToastNotification(update);
    });

    const unbindPolling = commands.onPollingCycleComplete(() => {
      get().updateLastPollTime?.();
    });

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
    } catch (error) {
      get().markInitializationFailed(error);
    } finally {
      set((state) => {
        state.isInitializing = false;
      });
    }
  },
});
