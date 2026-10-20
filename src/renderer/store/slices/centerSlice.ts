// src/renderer/store/slices/centerSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type {
  ActiveFlags,
  CenterId,
} from "@shared/types/operation/operationTypes";
import { operationService } from "@renderer/features/operation/operationService";

export interface CenterSlice extends ActiveFlags {
  toggleCenter: (id: CenterId) => void;
}

// センターフラグ（1C/2C/3C）の有効状態を管理するスライスを生成する。
export const createCenterSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  CenterSlice
> = (set, get) => ({
  is1CActive: false,
  is2CActive: false,
  is3CActive: false,

  // 指定センターのアクティブフラグを反転させバックエンドへ通知する。
  toggleCenter: (id) => {
    const key = `is${id}Active` as keyof ActiveFlags;

    set((state) => {
      state[key] = !state[key];
    });

    const { is1CActive, is2CActive, is3CActive } = get();

    void operationService.setActiveFlags({
      is1CActive,
      is2CActive,
      is3CActive,
    });
  },
});
