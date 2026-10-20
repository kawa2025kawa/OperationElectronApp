// electron/features/operation/application/activeFlagsManager.ts

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";

let activeFlags: ActiveFlags = { ...DEFAULT_ACTIVE_FLAGS };

// センターフラグ（1C/2C/3C）の有効状態を更新する。
export function setActiveFlags(flags?: Partial<ActiveFlags>): void {
  if (flags) {
    activeFlags = { ...activeFlags, ...flags };
  }
}

// 現在保持しているセンターフラグのコピーを取得する。
export function getActiveFlags(): ActiveFlags {
  return { ...activeFlags };
}
