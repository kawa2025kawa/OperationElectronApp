// src/renderer/store/slices/initSlice.ts

import type { StateCreator } from "zustand";

import { appService } from "@renderer/services/appService";
import type { AppState } from "@renderer/store";
import { setupInitIpcListeners } from "@renderer/store/listeners/initIpcListeners";
import {
  createInitStatus,
  getUnsettledStatusAsNg,
  INITIAL_INIT_STATUS,
  isInitStatusSettled,
  type InitStatus,
} from "@shared/types/initializationTypes";

const APP_LOADER_DELAY_MS = 2000;

let loaderTimeoutId: number | null = null;

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
    const { initStatus, isInitializing, isInitialLoaded, showAppLoader } = get();

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

    set((state) => {
      state.isAuthenticated = false;
    });

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
      const unsettledPatch = getUnsettledStatusAsNg(get().initStatus);
      if (Object.keys(unsettledPatch).length > 0) {
        get().setInitStatus(unsettledPatch);
      }
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
