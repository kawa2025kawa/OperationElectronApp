// src/shared/store/slices/centerSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { commands } from "@renderer/services/commands";

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
    // 1. センターフラグの更新
    set((state: AppState) => {
      state[key] = !state[key];
    });

    const state = get();

    // 2. Main プロセスへ最新のセンターフラグを送信して同期
    const activeFlags = {
      is1CActive: state.is1CActive,
      is2CActive: state.is2CActive,
      is3CActive: state.is3CActive,
    };
    void commands.setActiveFlags?.(activeFlags);

    // 3. 画面側サマリーの再計算
    state.recalculateSummary();
  },
});

export const selectIsAllCenterActive = (state: AppState): boolean =>
  state.is1CActive && state.is2CActive && state.is3CActive;
