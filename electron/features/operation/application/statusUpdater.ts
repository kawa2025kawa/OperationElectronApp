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
import { notifyReady, notifyStatusUpdated } from "./statusNotifier";
import { statusState } from "./statusState";

interface ApplyStatusOptions {
  propagate?: boolean;
  flags?: ActiveFlags;
}

// キューに入った依存ターゲットの再計算を順次処理する。
function processPropagation(flags = statusState.activeFlags): void {
  statusState.propagator.processPropagation((kanriNo) => {
    recalculateTargetStatus(kanriNo, flags, false);
  });
}

// ステータス変更をインメモリ・ディスクに反映し、READY通知や依存伝播を行う。
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

// 指定管理Noのステータスを前提条件やセンターフラグに基づき再計算する。
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

// 全ターゲットのステータスを一括で再計算・判定する。
export function recalculateAllStatuses(
  flags: ActiveFlags = statusState.activeFlags,
): void {
  statusState.propagator.enqueueAllRecalculableTargets(
    statusState.statuses,
    statusState.targets,
  );

  processPropagation(flags);
}

// ステータス更新を適用する公開関数。
export function updateStatus(update: OperationStatusState): boolean {
  return applyStatus(update);
}

// 手動指定されたステータスとコメントを対象管理Noに反映する。
export function updateManualStatus(
  kanriNo: string | number,
  status: JobStatus,
  comment = "",
): boolean {
  const normalizedKanriNo = normalizeKanriNo(kanriNo);
  if (!normalizedKanriNo) return false;

  return updateStatus({
    kanriNo: normalizedKanriNo,
    status,
    comment,
  });
}

// 全ステータスを予定状態にリセットし再計算する。
export function resetAllStatusesToScheduled(): Record<
  string,
  OperationStatusState
> {
  statusState.propagator.clearQueue();

  for (const kanriNo of statusState.statuses.keys()) {
    applyStatus(
      {
        kanriNo,
        status: JOB_STATUS.SCHEDULED,
        comment: "",
      },
      { propagate: false },
    );
  }

  recalculateAllStatuses(statusState.activeFlags);
  persistStatusesImmediately(statusState.statuses);

  return Object.fromEntries(statusState.statuses);
}
