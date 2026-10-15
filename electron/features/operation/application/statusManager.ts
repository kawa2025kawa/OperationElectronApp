// electron/features/operation/application/statusManager.ts

import { getActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { calculateOperationStatus } from "@electron/features/operation/domain/statusCalculator";
import {
  createScheduledStatus,
  hasStatusChanged,
  isProtectedStatus,
  isRunningStatus,
  mergeStatus,
} from "@electron/features/operation/domain/statusRules";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { JsonMasterData } from "@shared/types/masterData/jsonMasterDataTypes";
import {
  deleteStatusFile,
  loadStatusesFromFile,
  persistStatusesDebounced,
  persistStatusesImmediately,
} from "@electron/features/operation/infrastructure/storage/statusStorage";
import { DependencyPropagator } from "./dependencyPropagator";
import {
  notifyReady,
  notifyStatusCleared,
  notifyStatusUpdated,
  onReadyStatus,
  type StatusTarget,
} from "./statusNotifier";
import { statusStore } from "./statusStore";

export type { StatusTarget };
export { onReadyStatus };

type StatusMap = Record<string, OperationStatusState>;

interface ApplyStatusOptions {
  propagate?: boolean;
}

const propagator = new DependencyPropagator();

export function getDependencyMasters() {
  return statusStore.dependencyMasters;
}

export function recalculateTargetStatus(
  kanriNo: string,
  activeFlags: ActiveFlags = getActiveFlags(),
): void {
  const target = statusStore.targets.get(kanriNo);
  if (!target) {
    return;
  }

  const current = statusStore.statuses.get(kanriNo);
  if (isProtectedStatus(current?.status)) {
    return;
  }

  applyStatus(
    calculateOperationStatus(
      target,
      getDependencyMasters(),
      getDependencyStatuses(),
      activeFlags,
    ),
  );
}

function processPropagation(activeFlags = getActiveFlags()): void {
  propagator.processPropagation((kanriNo) => {
    recalculateTargetStatus(kanriNo, activeFlags);
  });
}

function applyStatus(
  update: OperationStatusState,
  { propagate = true }: ApplyStatusOptions = {},
): boolean {
  const kanriNo = normalizeKanriNo(update.kanriNo);
  if (!kanriNo) {
    return false;
  }

  const previous = statusStore.statuses.get(kanriNo);
  const next = mergeStatus(previous, {
    ...update,
    kanriNo,
  });

  if (!hasStatusChanged(previous, next)) {
    return true;
  }

  statusStore.statuses.set(kanriNo, next);
  persistStatusesDebounced(statusStore.statuses);
  notifyStatusUpdated(next);

  if (
    next.status === JOB_STATUS.READY &&
    previous?.status !== JOB_STATUS.READY
  ) {
    const target = statusStore.targets.get(kanriNo);
    if (target) {
      notifyReady(target);
    }
  }

  if (propagate) {
    propagator.enqueueDependents(kanriNo);
    processPropagation();
  }

  return true;
}

export function getStatus(
  kanriNo: string | number,
): OperationStatusState | undefined {
  return statusStore.statuses.get(normalizeKanriNo(kanriNo));
}

export function getTargetByKanriNo(
  kanriNo: string | number,
): StatusTarget | undefined {
  return statusStore.targets.get(normalizeKanriNo(kanriNo));
}

export function getRegisteredTargets(): StatusTarget[] {
  return [...statusStore.targets.values()];
}

export function updateStatus(update: OperationStatusState): boolean {
  return applyStatus(update);
}

export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment = "",
): boolean {
  const normalizedKanriNo = normalizeKanriNo(kanriNo);
  if (!normalizedKanriNo) {
    return false;
  }

  return updateStatus({
    kanriNo: normalizedKanriNo,
    status,
    comment,
  });
}

export function getDependencyStatuses(): {
  statuses: StatusMap;
} {
  return {
    statuses: Object.fromEntries(statusStore.statuses),
  };
}

export function registerTargets(
  targetList: StatusTarget[],
  masterData: JsonMasterData,
): void {
  statusStore.setDependencyMasters(masterData);

  for (const target of targetList) {
    const kanriNo = normalizeKanriNo(target.kanriNo);
    if (!kanriNo) {
      continue;
    }
    statusStore.targets.set(kanriNo, target);

    if (!statusStore.statuses.has(kanriNo)) {
      statusStore.statuses.set(kanriNo, createScheduledStatus(kanriNo));
    }
  }

  propagator.rebuildDependencyIndex(statusStore.targets.values());
  propagator.enqueueAllRecalculableTargets(
    statusStore.statuses,
    statusStore.targets,
  );
  processPropagation(getActiveFlags());
  persistStatusesDebounced(statusStore.statuses);
}

export async function initializeStatuses(): Promise<
  Record<string, OperationStatusState>
> {
  const persistedStatuses = await loadStatusesFromFile();
  statusStore.statuses.clear();

  let recoveredRunningStatus = false;
  for (const [kanriNo, status] of Object.entries(persistedStatuses)) {
    const normalizedKanriNo = normalizeKanriNo(kanriNo);
    if (!normalizedKanriNo) {
      continue;
    }

    if (isRunningStatus(status.status)) {
      statusStore.statuses.set(
        normalizedKanriNo,
        createScheduledStatus(normalizedKanriNo),
      );
      recoveredRunningStatus = true;
      continue;
    }

    statusStore.statuses.set(normalizedKanriNo, {
      ...status,
      kanriNo: normalizedKanriNo,
    });
  }

  if (recoveredRunningStatus) {
    persistStatusesDebounced(statusStore.statuses);
  }

  return Object.fromEntries(statusStore.statuses);
}

export function resetAllStatusesToScheduled(): Record<
  string,
  OperationStatusState
> {
  propagator.clearQueue();

  for (const kanriNo of statusStore.statuses.keys()) {
    applyStatus(
      {
        kanriNo,
        status: JOB_STATUS.SCHEDULED,
        comment: "",
      },
      { propagate: false },
    );
  }

  propagator.enqueueAllRecalculableTargets(
    statusStore.statuses,
    statusStore.targets,
  );
  processPropagation();
  persistStatusesImmediately(statusStore.statuses);

  return Object.fromEntries(statusStore.statuses);
}

export async function deleteAllStatuses(): Promise<void> {
  const targetKanriNos = [...statusStore.targets.keys()];

  propagator.clearQueue();
  statusStore.statuses.clear();
  await deleteStatusFile();

  for (const kanriNo of targetKanriNos) {
    notifyStatusCleared(kanriNo);
  }
}

export function refreshDependencyStatuses(): void {
  propagator.clearQueue();
  propagator.enqueueCenterFlagDependents(statusStore.targets);
  processPropagation();
}
