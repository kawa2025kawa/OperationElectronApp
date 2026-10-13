// electron/features/operation/application/activeFlagsManager.ts

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
} from "@shared/types/operation/operationTypes";

let activeFlags = { ...DEFAULT_ACTIVE_FLAGS };

const isDebugEnabled = () => process.env.DEBUG_ACTIVE_FLAGS === "true";

let previousLoggedFlags: string | null = null;

export const setActiveFlags = (flags?: Partial<ActiveFlags>) => {
  if (flags) {
    activeFlags = { ...activeFlags, ...flags };
  }

  if (isDebugEnabled()) {
    console.log("[DEBUG activeFlagsManager] set", activeFlags);
  }
};

export const getActiveFlags = () => {
  const flags = { ...activeFlags };

  if (isDebugEnabled()) {
    const serializedFlags = JSON.stringify(flags);

    if (serializedFlags !== previousLoggedFlags) {
      console.log("[DEBUG activeFlagsManager] get", flags);
      previousLoggedFlags = serializedFlags;
    }
  }

  return flags;
};
