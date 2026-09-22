// src/renderer/store/slices/initSlice.ts
import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { INITIAL_INIT_STATUS, type InitStatus } from "@shared/types/system";
import { appService } from "@renderer/services/appService";
import { commands } from "@renderer/services/commands";
import { handleStatusToastNotification } from "@renderer/components/ui/toast/statusToastHandler";

const APP_LOADER_DELAY_MS = 2000;
let loaderTimeoutId: number | null = null;
let cleanupIpcListeners: (() => void) | null = null;

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

  setInitStatus: (update) => {
    set((state) => {
      const next =
        typeof update === "function" ? update(state.initStatus) : update;
      if (next) {
        Object.assign(state.initStatus, next);
      }
    });

    const currentStatus = get().initStatus;
    const statusValues = Object.values(currentStatus);

    // 全てのステータスが OK / NG / CONNECTED に定まったか判定
    const isAllSettled =
      statusValues.length > 0 &&
      statusValues.every(
        (val) => val === "OK" || val === "NG" || val === "CONNECTED",
      );

    // 全て完了かつ初回ロード未完了の場合、2秒後にローダーを閉じる
    if (isAllSettled && !get().isInitialLoaded && loaderTimeoutId === null) {
      loaderTimeoutId = window.setTimeout(() => {
        set((state) => {
          state.isInitialLoaded = true;
          state.showAppLoader = false;
        });
        loaderTimeoutId = null;
      }, APP_LOADER_DELAY_MS);
    }
  },

  markInitializationCompleted: () => {
    const updatedStatus: Partial<InitStatus> = {};
    Object.keys(get().initStatus).forEach((key) => {
      const k = key as keyof InitStatus;
      updatedStatus[k] = "OK";
    });
    get().setInitStatus(updatedStatus);
  },

  markInitializationFailed: (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[InitSlice] Failed to initialize app:", message);

    const updatedStatus: Partial<InitStatus> = {};
    Object.keys(get().initStatus).forEach((key) => {
      const k = key as keyof InitStatus;
      const val = get().initStatus[k];
      if (val !== "OK" && val !== "CONNECTED") {
        updatedStatus[k] = "NG";
      }
    });

    set((state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
    });

    get().setInitStatus(updatedStatus);
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

    const unbindStatus = commands.onOperationStatusUpdated((payload) => {
      const item =
        payload &&
        typeof payload === "object" &&
        "status" in payload &&
        payload.status
          ? payload.status
          : payload;

      if (item && typeof item === "object") {
        handleStatusToastNotification(item as any);
      }
    });
    const unbindPolling = commands.onPollingCycleComplete((nextPollTime) => {
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
