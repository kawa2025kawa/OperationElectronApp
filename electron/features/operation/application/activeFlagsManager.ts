// electron/features/operation/activeFlagsManager.ts

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";

let activeFlags = { ...DEFAULT_ACTIVE_FLAGS };

export const setActiveFlags = (flags?: Partial<ActiveFlags>) => {
  if (flags) {
    activeFlags = { ...activeFlags, ...flags };
  }

  console.log("[DEBUG activeFlagsManager] set", activeFlags);
};

export const getActiveFlags = () => {
  const flags = { ...activeFlags };

  console.log("[DEBUG activeFlagsManager] get", flags);

  return flags;
};
