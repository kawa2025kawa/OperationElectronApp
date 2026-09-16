// electron/features/operation/activeFlagsManager.ts

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation";

let activeFlags: ActiveFlags = { ...DEFAULT_ACTIVE_FLAGS };

export function setActiveFlags(flags?: Partial<ActiveFlags>): void {
  if (!flags) return;
  activeFlags = { ...activeFlags, ...flags };
}

export const getActiveFlags = (): ActiveFlags => activeFlags;
