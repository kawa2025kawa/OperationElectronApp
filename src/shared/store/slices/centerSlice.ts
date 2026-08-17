// src/shared/store/slices/centerSlice.ts

import type { StateCreator } from "zustand";
import type { AppState } from "@shared/store/index";
import {
  calculateNextStatus,
  refreshDependentStatuses,
} from "@renderer/features/operation/helpers/statusEvaluator";
import { getAllEntities } from "@renderer/features/operation/helpers/operationEntities";
import { commands } from "@shared/api/commands";

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

  toggleCenterPill: (key: "is1CActive" | "is2CActive" | "is3CActive") => {
    // 1. アクティブフラグを反転
    set((state: AppState) => {
      state[key] = !state[key];
    });

    // 2. フラグ変更後の State を取得
    const state = get();
    const allEntities = getAllEntities(state);
    const activeFlags = {
      is1CActive: Boolean(state.is1CActive),
      is2CActive: Boolean(state.is2CActive),
      is3CActive: Boolean(state.is3CActive),
    };

    // 3. 全エンティティのステータスを再評価して追従更新
    for (const [kanriNo, entity] of Object.entries(allEntities)) {
      const nextStatus = calculateNextStatus(
        entity,
        undefined,
        allEntities,
        activeFlags,
      );

      if (entity.status !== nextStatus) {
        set((s: AppState) => {
          const target =
            s.operationEntities[kanriNo] ?? s.irregularEntities[kanriNo];
          if (target) {
            target.status = nextStatus;
          }
        });

        // メインプロセス/StatusManagerへ変更を同期
        void commands.updateJobStatus(
          kanriNo,
          nextStatus,
          entity.comment ?? "",
        );

        // 後続の依存ジョブも連動更新
        refreshDependentStatuses(state, kanriNo);
      }
    }
  },
});
