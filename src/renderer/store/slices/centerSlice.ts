// src/renderer/store/slices/centerSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@renderer/store";
import type {
  ActiveFlags,
  CenterId,
} from "@shared/types/operation/operationTypes";
import { operationService } from "@renderer/features/operation/operationService";

export interface CenterSlice extends ActiveFlags {
  toggleCenter: (id: CenterId) => Promise<void>;
  applyCenterFlags: (flags: ActiveFlags) => void;
}

// センターフラグ（1C/2C/3C）の有効状態を管理するスライスを生成する。
export const createCenterSlice: StateCreator<
  AppState,
  [["zustand/immer", never]],
  [],
  CenterSlice
> = (set, get) => {
  let updateRevision = 0;

  return {
    is1CActive: false,
    is2CActive: false,
    is3CActive: false,

    // 取得済みセンターフラグをStoreへ反映する。
    applyCenterFlags: (flags) => {
      set((state) => {
        Object.assign(state, flags);
      });
    },

    // 指定センターの状態を切り替え、保存失敗時はバックエンドの状態へ戻す。
    toggleCenter: async (id) => {
      const previousFlags: ActiveFlags = {
        is1CActive: get().is1CActive,
        is2CActive: get().is2CActive,
        is3CActive: get().is3CActive,
      };

      const key = `is${id}Active` as keyof ActiveFlags;
      const revision = ++updateRevision;

      set((state) => {
        state[key] = !state[key];
      });

      const nextFlags: ActiveFlags = {
        is1CActive: get().is1CActive,
        is2CActive: get().is2CActive,
        is3CActive: get().is3CActive,
      };

      try {
        await operationService.setActiveFlags(nextFlags);
      } catch (error) {
        console.error("[CenterSlice] Failed to update center flags:", error);

        // 後続の操作がある場合、古い失敗処理でStoreを上書きしない。
        if (revision !== updateRevision) return;

        try {
          const currentFlags = await operationService.getActiveFlags();

          if (revision === updateRevision) {
            get().applyCenterFlags(currentFlags);
          }
        } catch (restoreError) {
          console.error(
            "[CenterSlice] Failed to restore center flags:",
            restoreError,
          );

          if (revision === updateRevision) {
            get().applyCenterFlags(previousFlags);
          }
        }
      }
    },
  };
};
