// electron/features/operation/application/statusManager.ts

import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import {
  loadActiveFlags,
  persistActiveFlags,
} from "@electron/features/operation/infrastructure/storage/activeFlagsStorage";
import {
  type ActiveFlags,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type {
  DependencyMasters,
  DependencyStatuses,
} from "@electron/features/operation/domain/dependencyUtils";
import { statusState } from "./statusState";
import type { ReadyStatusListener, StatusTarget } from "./statusTypes";
import {
  recalculateAllStatuses,
  recalculateTargetStatus,
  updateManualStatus,
  updateStatus,
} from "./statusUpdater";
import {
  deleteAllStatuses,
  initializeStatuses,
  registerOperationTargets,
  resetOperationStatuses,
} from "./statusLifecycleService";
import { onReadyStatus } from "./statusNotifier";

export type { ReadyStatusListener, StatusTarget };

export function initializeActiveFlags(): void {
  statusState.activeFlags = loadActiveFlags();
}

export function getActiveFlags(): ActiveFlags {
  return { ...statusState.activeFlags };
}

export function getDependencyMasters(): DependencyMasters {
  return statusState.dependencyMasters;
}

export function getDependencyStatuses(): DependencyStatuses {
  return {
    statuses: statusState.statuses,
  };
}

export function getTargets(): Map<string, StatusTarget> {
  return new Map(statusState.targets);
}

export function getStatuses(): Map<string, OperationStatusState> {
  return new Map(statusState.statuses);
}

export function getStatus(
  kanriNo: string | number,
): OperationStatusState | undefined {
  return statusState.statuses.get(normalizeKanriNo(kanriNo));
}

export function getTargetByKanriNo(
  kanriNo: string | number,
): StatusTarget | undefined {
  return statusState.targets.get(normalizeKanriNo(kanriNo));
}

export function getRegisteredTargets(): StatusTarget[] {
  return [...statusState.targets.values()];
}

export {
  recalculateAllStatuses,
  recalculateTargetStatus,
  updateManualStatus,
  updateStatus,
};

export function updateOperationActiveFlags(flags: Partial<ActiveFlags>): void {
  const nextFlags: ActiveFlags = {
    ...statusState.activeFlags,
    ...flags,
  };

  persistActiveFlags(nextFlags);
  statusState.activeFlags = nextFlags;
  recalculateAllStatuses(nextFlags);
}

export {
  deleteAllStatuses,
  initializeStatuses,
  registerOperationTargets,
  resetOperationStatuses,
};

export { onReadyStatus };
