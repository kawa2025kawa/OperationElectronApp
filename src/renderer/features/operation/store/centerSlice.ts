// src/shared/store/slices/centerSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import { commands } from "@renderer/services/commands";
import {
  getCenterKey,
  type ActiveFlags,
  type CenterId,
} from "@shared/types/operation";

export interface CenterSlice extends ActiveFlags {
  toggleCenter: (id: CenterId) => void;
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

  toggleCenter: (id) => {
    const key = getCenterKey(id);

    set((state) => {
      state[key] = !state[key];
      state.recalculateSummary();
    });

    const { is1CActive, is2CActive, is3CActive } = get();
    void commands.setActiveFlags({ is1CActive, is2CActive, is3CActive });
  },
});

export function getActiveFlagsFromState(state: AppState): ActiveFlags {
  return {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };
}

export const selectIsAllCenterActive = (state: AppState): boolean =>
  state.is1CActive && state.is2CActive && state.is3CActive;
