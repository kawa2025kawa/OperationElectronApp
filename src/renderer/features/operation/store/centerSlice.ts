// src/renderer/features/operation/store/centerSlice.ts

import type { StateCreator } from "zustand";
import { trpc } from "@renderer/lib/trpc";
import type { AppState } from "@renderer/store";
import type {
  ActiveFlags,
  CenterId,
} from "@shared/types/operation/operationTypes";

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
    const key = `is${id}Active` as keyof ActiveFlags;

    set((state) => {
      state[key] = !state[key];
    });

    const { is1CActive, is2CActive, is3CActive } = get();

    void trpc.operation.setActiveFlags.mutate({
      is1CActive,
      is2CActive,
      is3CActive,
    });
  },
});
