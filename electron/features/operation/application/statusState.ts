// electron/features/operation/application/statusState.ts

import {
  DEFAULT_ACTIVE_FLAGS,
  type ActiveFlags,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { DependencyMasters } from "@electron/features/operation/domain/dependencyUtils";
import type { StatusTarget } from "./statusTypes";
import { DependencyPropagator } from "./dependencyPropagator";

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
