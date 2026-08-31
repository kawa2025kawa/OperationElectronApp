// src/shared/store/slices/initSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import {
  INITIAL_INIT_STATUS,
  type InitStatus,
} from "@shared/types/initializationTypes";
import { appService } from "@renderer/services/appService";

export interface InitSlice {
  isInitialLoaded: boolean;
  isInitializing: boolean;
  showAppLoader: boolean;
  initStatus: InitStatus;
  setIsInitialLoaded: (isInitialLoaded: boolean) => void;
  setShowAppLoader: (show: boolean) => void;
  setInitStatus: (
    update:
      | Partial<InitStatus>
      | ((prev: InitStatus) => Partial<InitStatus> | void),
  ) => void;
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

  setIsInitialLoaded: (isInitialLoaded) =>
    set((state: AppState) => {
      state.isInitialLoaded = isInitialLoaded;
    }),

  setShowAppLoader: (show) =>
    set((state: AppState) => {
      state.showAppLoader = show;
    }),

  setInitStatus: (update) =>
    set((state: AppState) => {
      const next =
        typeof update === "function" ? update(state.initStatus) : update;
      if (next) {
        Object.assign(state.initStatus, next);
      }
    }),

  initializeApp: async () => {
    if (get().isInitializing || get().isInitialLoaded) {
      return;
    }

    set((state: AppState) => {
      state.isInitializing = true;
    });

    try {
      // ★ actions.ts を経由せず直接実行[cite: 1]
      await appService.initializeApp();
    } finally {
      set((state: AppState) => {
        state.isInitializing = false;
      });
    }
  },
});
