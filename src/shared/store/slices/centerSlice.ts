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
> = (set, get) => ({
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,

  toggleCenterPill: (key) => {
    // 1. センターフラグの状態を安全にトグル更新
    set((state: AppState) => {
      state[key] = !state[key];
    });

    // 2. フラグ変更に伴う件数サマリーの再計算
    get().recalculateSummary();
  },
});

/**
 * 🎯 セレクター: 1C / 2C / 3C の3つすべてが active (true) であるか判定する合成値 D
 */
export const selectIsAllCenterActive = (state: AppState): boolean =>
  state.is1CActive && state.is2CActive && state.is3CActive;
