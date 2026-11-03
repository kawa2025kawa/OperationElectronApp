// src/renderer/store/slices/initSlice.ts

import type { StateCreator } from "zustand";

import { appService } from "@renderer/services/appService";
import type { AppState } from "@renderer/store";
import { setupInitIpcListeners } from "@renderer/store/listeners/initIpcListeners";
import {
  createInitStatus,
  INITIAL_INIT_STATUS,
  SETTLED_INIT_STATUS_VALUES,
  type InitStatus,
} from "@shared/types/initializationTypes";

const APP_LOADER_DELAY_MS = 2000;

let loaderTimeoutId: number | null = null;

const isSettledStatus = (value: unknown): boolean =>
  SETTLED_INIT_STATUS_VALUES.some((status) => status === value);

const isInitStatusSettled = (status: InitStatus): boolean =>
  Object.values(status).every(isSettledStatus);

const getUnsettledStatus = (status: InitStatus): Partial<InitStatus> =>
  Object.fromEntries(
    Object.entries(status)
      .filter(([, value]) => !isSettledStatus(value))
      .map(([key]) => [key, "NG"]),
  ) as Partial<InitStatus>;

const clearLoaderTimeout = (): void => {
  if (loaderTimeoutId === null) return;

  window.clearTimeout(loaderTimeoutId);
  loaderTimeoutId = null;
};

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

  settleUnsettledAsNg(): void;

  initializeApp(): Promise<void>;
}

export const createInitSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  InitSlice
> = (set, get) => {
  const scheduleLoaderClose = (): void => {
    const { initStatus, isInitializing, isInitialLoaded, showAppLoader } =
      get();

    if (
      !isInitStatusSettled(initStatus) ||
      isInitializing ||
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

  const markInitializationFailed = (error: unknown): void => {
    console.error(
      "[InitSlice] Failed to initialize app:",
      error instanceof Error ? error.message : String(error),
    );

    get().settleUnsettledAsNg();
  };

  return {
    isInitialLoaded: false,
    isInitializing: false,
    showAppLoader: true,
    initStatus: INITIAL_INIT_STATUS,

    setInitStatus: (update) => {
      set((state) => {
        const next =
          typeof update === "function" ? update(state.initStatus) : update;

        if (next) {
          Object.assign(state.initStatus, next);
        }
      });

      if (!isInitStatusSettled(get().initStatus)) {
        clearLoaderTimeout();
        return;
      }

      scheduleLoaderClose();
    },

    settleUnsettledAsNg: () => {
      get().setInitStatus(getUnsettledStatus(get().initStatus));
    },

    initializeApp: async () => {
      if (get().isInitializing || get().isInitialLoaded) return;

      clearLoaderTimeout();

      set((state) => {
        state.isInitializing = true;
        state.isInitialLoaded = false;
        state.showAppLoader = true;
        state.initStatus = createInitStatus("LOADING");
      });

      try {
        setupInitIpcListeners(get);
        await appService.initializeAppData();
      } catch (error) {
        markInitializationFailed(error);
      } finally {
        set((state) => {
          state.isInitializing = false;
        });

        scheduleLoaderClose();
      }
    },
  };
};
