// electron/features/operation/application/statusFlagService.ts

import {
  loadActiveFlags,
  persistActiveFlags,
} from "@electron/features/operation/infrastructure/storage/activeFlagsStorage";
import { type ActiveFlags } from "@shared/types/operation/operationTypes";
import { statusState } from "./statusState";
import { recalculateAllStatuses } from "./statusUpdater";

export async function initializeActiveFlags(): Promise<void> {
  statusState.activeFlags = await loadActiveFlags();
}

export function getActiveFlags(): ActiveFlags {
  return { ...statusState.activeFlags };
}

export function updateOperationActiveFlags(flags: Partial<ActiveFlags>): void {
  const nextFlags: ActiveFlags = {
    ...statusState.activeFlags,
    ...flags,
  };

  void persistActiveFlags(nextFlags);
  statusState.activeFlags = nextFlags;
  recalculateAllStatuses(nextFlags);
}
