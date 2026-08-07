// src/shared/store/slices/centerSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store/index";

export interface CenterSlice {
  is1CActive: boolean;
  is2CActive: boolean;
  is3CActive: boolean;

  toggleCenterPill: (key: "is1CActive" | "is2CActive" | "is3CActive") => void;
}

export const createCenterSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  CenterSlice
> = (set) => ({
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,

  toggleCenterPill: (key: "is1CActive" | "is2CActive" | "is3CActive") =>
    set((state: AppState) => {
      // 純粋にフロント側のStateのみを切り替える
      state[key] = !state[key];
    }),
});
