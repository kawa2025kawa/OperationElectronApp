// src/shared/store/slices/initSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store";
import {
  INITIAL_INIT_STATUS,
  type InitStatus,
} from "@shared/types/initializationTypes";

export interface InitSlice {
  isInitialLoaded: boolean;
  initStatus: InitStatus;

  setIsInitialLoaded: (isInitialLoaded: boolean) => void;
  setInitStatus: (
    update:
      | Partial<InitStatus>
      | ((prev: InitStatus) => Partial<InitStatus> | void),
  ) => void;
}

export const createInitSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  InitSlice
> = (set) => ({
  isInitialLoaded: false,
  initStatus: INITIAL_INIT_STATUS,

  setIsInitialLoaded: (isInitialLoaded) =>
    set((state: AppState) => {
      state.isInitialLoaded = isInitialLoaded;
    }),

  setInitStatus: (update) =>
    set((state: AppState) => {
      const next =
        typeof update === "function" ? update(state.initStatus) : update;
      if (next) {
        Object.assign(state.initStatus, next);
      }
    }),
});
