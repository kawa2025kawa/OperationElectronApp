// src/renderer/store/slices/initSlice.ts

import type { StateCreator } from "zustand";

import { handleStatusToastNotification } from "@renderer/components/ui/toast/statusToastHandler";
import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
import { appService } from "@renderer/services/appService";
import type { AppState } from "@renderer/store";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";

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

let cleanupIpcListeners: (() => void) | null = null;

const DATA_LOADING_STATUS: InitStatus = {
  update: "LOADING",
  operation: "LOADING",
  irregular: "LOADING",
  todayIrregular: "LOADING",
  auth: "LOADING",
  store: "LOADING",
  jugyoin: "LOADING",
  kokyuhyo: "LOADING",
  tantou: "LOADING",
};

/* =========================
 * Initialization Helpers
 * ========================= */

const isSettledStatus = (value: unknown): boolean => {
  return value === "OK" || value === "NG" || value === "CONNECTED";
};

const isInitStatusSettled = (status: InitStatus): boolean => {
  return Object.values(status).every(isSettledStatus);
};

const getUnsettledStatus = (status: InitStatus): Partial<InitStatus> => {
  return Object.fromEntries(
    Object.entries(status)
      .filter(([, value]) => !isSettledStatus(value))
      .map(([key]) => [key, "NG"]),
  ) as Partial<InitStatus>;
};

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
  isIpcListenersSetup: boolean;

  setIsInitialLoaded(value: boolean): void;

  setShowAppLoader(value: boolean): void;

  setInitStatus(
    update:
      | Partial<InitStatus>
      | ((prev: InitStatus) => Partial<InitStatus> | void),
  ): void;

  markInitializationCompleted(): void;

  markInitializationFailed(error: unknown): void;

  setupIpcListeners(): void;

  initializeApp(): Promise<void>;
}

export const createInitSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  InitSlice
> = (set, get) => {
  /* =========================
   * Loader
   * ========================= */

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
   * IPC Listeners
   * ========================= */

  const setupThemeListener = (): (() => void) => {
    return window.electronAPI.on(
      IPC_CHANNELS.SYSTEM.THEME_CHANGED,
      (theme: unknown) => {
        if (theme === "dark" || theme === "light") {
          get().setTheme?.(theme);
        }
      },
    );
  };

  const setupOperationStatusListener = (): (() => void) => {
    return window.electronAPI.on(
      IPC_CHANNELS.OPERATION.STATUS_UPDATED,
      (value: unknown) => {
        if (!value) {
          return;
        }

        // 単一オブジェクトで届いた場合は配列にラップして正規化
        const updates: OperationStatusState[] = Array.isArray(value)
          ? (value as OperationStatusState[])
          : [value as OperationStatusState];

        if (updates.length === 0) {
          return;
        }

        for (const update of updates) {
          handleStatusToastNotification(update);
        }

        get().applyOperationStatusUpdates(updates);
      },
    );
  };
  const setupPollingListener = (): (() => void) => {
    return window.electronAPI.on(
      IPC_CHANNELS.OPERATION.POLLING_CYCLE_COMPLETE,
      () => {
        get().updateLastPollTime?.();
        usePollingToastStore.getState().markPollingCycleCompleted();
      },
    );
  };

  /* =========================
   * Public API
   * ========================= */

  return {
    isInitialLoaded: false,

    isInitializing: false,

    showAppLoader: true,

    initStatus: INITIAL_INIT_STATUS,

    isIpcListenersSetup: false,

    /* =========================
     * Loader State
     * ========================= */

    setIsInitialLoaded: (value) => {
      if (value) {
        clearLoaderTimeout();
      }

      set((state) => {
        state.isInitialLoaded = value;
      });
    },

    setShowAppLoader: (value) => {
      if (!value) {
        clearLoaderTimeout();
      }

      set((state) => {
        state.showAppLoader = value;
      });
    },

    /* =========================
     * Initialization Status
     * ========================= */

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

    markInitializationCompleted: () => {
      const { initStatus } = get();

      if (!isInitStatusSettled(initStatus)) {
        console.warn(
          "[InitSlice] Initialization completion requested before all startup tasks settled.",
          initStatus,
        );

        return;
      }

      scheduleLoaderClose();
    },

    markInitializationFailed: (error) => {
      const message = error instanceof Error ? error.message : String(error);

      console.error("[InitSlice] Failed to initialize app:", message);

      const failed = getUnsettledStatus(get().initStatus);

      set((state) => {
        state.isAuthenticated = false;
      });

      get().setInitStatus(failed);
    },

    /* =========================
     * IPC Setup
     * ========================= */

    setupIpcListeners: () => {
      if (get().isIpcListenersSetup) {
        return;
      }

      cleanupIpcListeners?.();

      const unbindTheme = setupThemeListener();
      const unbindStatus = setupOperationStatusListener();
      const unbindPolling = setupPollingListener();

      cleanupIpcListeners = () => {
        unbindTheme();
        unbindStatus();
        unbindPolling();

        cleanupIpcListeners = null;
      };

      set((state) => {
        state.isIpcListenersSetup = true;
      });
    },

    /* =========================
     * Application Initialization
     * ========================= */

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
        get().setupIpcListeners();

        await appService.initializeAppData();

        get().markInitializationCompleted();
      } catch (error) {
        get().markInitializationFailed(error);
      } finally {
        set((state) => {
          state.isInitializing = false;
        });
      }
    },
  };
};
