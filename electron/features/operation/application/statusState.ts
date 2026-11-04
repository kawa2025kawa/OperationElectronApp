// electron/features/operation/application/statusState.ts

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import type {
  DependencyMasters,
  DependencyStatuses,
} from "@electron/features/operation/domain/dependencyUtils";
import { DependencyPropagator } from "./dependencyPropagator";
import type { StatusTarget } from "./statusTypes";

export const statusState = {
  targets: new Map<string, StatusTarget>(),
  statuses: new Map<string, OperationStatusState>(),
  activeFlags: { ...DEFAULT_ACTIVE_FLAGS } as ActiveFlags,
  dependencyMasters: {
    operationMasters: [],
    irregularMasters: [],
    todayIrregularMasters: [],
  } as DependencyMasters,
  propagator: new DependencyPropagator(),
};

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
