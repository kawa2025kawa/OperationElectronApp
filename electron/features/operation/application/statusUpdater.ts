// electron/features/operation/application/statusUpdater.ts

import {
  hasStatusChanged,
  isProtectedStatus,
  mergeStatus,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import { calculateOperationStatus } from "@electron/features/operation/domain/statusCalculator";
import {
  persistStatusesDebounced,
  persistStatusesImmediately,
} from "@electron/features/operation/infrastructure/storage/statusStorage";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import { statusState } from "./statusState";
import { notifyReady, notifyStatusUpdated } from "./statusNotifier";
import type { ApplyStatusOptions } from "./statusTypes";

function processPropagation(flags = statusState.activeFlags): void {
  statusState.propagator.processPropagation((kanriNo) => {
    recalculateTargetStatus(kanriNo, flags, false);
  });
}

function applyStatus(
  update: OperationStatusState,
  {
    propagate = true,
    flags = statusState.activeFlags,
  }: ApplyStatusOptions = {},
): boolean {
  const kanriNo = normalizeKanriNo(update.kanriNo);
  if (!kanriNo) return false;

  const previous = statusState.statuses.get(kanriNo);
  const next = mergeStatus(previous, {
    ...update,
    kanriNo,
  });

  if (!hasStatusChanged(previous, next)) {
    return true;
  }

  statusState.statuses.set(kanriNo, next);
  persistStatusesDebounced(statusState.statuses);
  notifyStatusUpdated(next);

  if (
    next.status === JOB_STATUS.READY &&
    previous?.status !== JOB_STATUS.READY
  ) {
    const target = statusState.targets.get(kanriNo);

    if (target) {
      notifyReady(target);
    }
  }

  if (propagate) {
    statusState.propagator.enqueueDependents(kanriNo);
    processPropagation(flags);
  }

  return true;
}

export function recalculateTargetStatus(
  kanriNo: string,
  flags: ActiveFlags = statusState.activeFlags,
  propagate = true,
): void {
  const target = statusState.targets.get(kanriNo);
  if (!target) return;

  const current = statusState.statuses.get(kanriNo);
  if (isProtectedStatus(current?.status)) return;

  applyStatus(
    calculateOperationStatus(
      target,
      statusState.dependencyMasters,
      { statuses: statusState.statuses },
      flags,
    ),
    { propagate, flags },
  );
}

// 全ターゲットのステータスを一括で再計算・判定する（依存関係順序で伝播）
export function recalculateAllStatuses(
  flags: ActiveFlags = statusState.activeFlags,
): void {
  statusState.propagator.enqueueAllRecalculableTargets(
    statusState.statuses,
    statusState.targets,
  );

  processPropagation(flags);
}

export function updateStatus(
  update: OperationStatusState,
  options?: ApplyStatusOptions,
): boolean;
export function updateStatus(
  kanriNo: string,
  status: JobStatus,
  options?: ApplyStatusOptions & { comment?: string },
): boolean;
export function updateStatus(
  inputOrKanriNo: OperationStatusState | string,
  statusOrOptions?: JobStatus | ApplyStatusOptions,
  options?: ApplyStatusOptions & { comment?: string },
): boolean {
  if (typeof inputOrKanriNo === "string") {
    return applyStatus(
      {
        kanriNo: inputOrKanriNo,
        status: statusOrOptions as JobStatus,
        comment: options?.comment,
      },
      options,
    );
  }

  return applyStatus(
    inputOrKanriNo,
    statusOrOptions as ApplyStatusOptions | undefined,
  );
}

export function updateManualStatus(
  kanriNo: string,
  status: JobStatus,
  comment = "",
): boolean {
  const result = updateStatus(kanriNo, status, {
    comment,
    propagate: true,
  });

  if (result) {
    void persistStatusesImmediately(statusState.statuses);
  }

  return result;
}
