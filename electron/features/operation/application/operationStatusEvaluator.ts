//electron\features\operation\application\operationStatusEvaluator.//

import { getActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  getDependencyMasters,
  getDependencyStatuses,
  getStatus,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { calculateOperationStatus } from "@electron/features/operation/domain/statusCalculator";
import { isProtectedStatus } from "@electron/features/operation/domain/statusRules";
import {
  fetchTrackerStatusByJobId,
  hasJobId,
} from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  type DependencyCheckResult,
} from "@shared/utils/dependency/dependencyUtils";

type OperationTarget = Extract<StatusTarget, { targetType: "operation" }>;

function hasTrackerTarget(target: StatusTarget): target is OperationTarget {
  return (
    target.targetType === "operation" &&
    Boolean(target.kanriNo) &&
    hasJobId(target)
  );
}

function canSyncTrackerStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.READY || status === JOB_STATUS.RUNNING;
}

function shouldKeepReadyStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.SCHEDULED || status === JOB_STATUS.WAITING;
}

function checkDependencies(
  kanriNo: string,
  activeFlags: ActiveFlags,
  dependencyMasters: ReturnType<typeof getDependencyMasters>,
): DependencyCheckResult {
  return checkJobDependencies(
    kanriNo,
    dependencyMasters,
    getDependencyStatuses(),
    activeFlags,
  );
}

function evaluateTrackerStatus(
  trackerStatus: OperationStatusState,
  activeFlags: ActiveFlags,
  dependencyMasters: ReturnType<typeof getDependencyMasters>,
): OperationStatusState {
  if (trackerStatus.status !== JOB_STATUS.SUCCESS) {
    return trackerStatus;
  }

  const dependencyResult = checkDependencies(
    trackerStatus.kanriNo,
    activeFlags,
    dependencyMasters,
  );

  if (dependencyResult.ok) {
    return trackerStatus;
  }

  const missingKanriNos = dependencyResult.missingDependencies
    .map(({ kanriNo }) => kanriNo)
    .filter(Boolean);

  return {
    ...trackerStatus,
    status: JOB_STATUS.WAITING,
    comment:
      missingKanriNos.length > 0
        ? `前提未完了(No.${missingKanriNos.join(", ")})`
        : "前提未完了",
  };
}

async function fetchTrackerStatus(
  target: OperationTarget,
): Promise<OperationStatusState | undefined> {
  return fetchTrackerStatusByJobId(
    target.jobId,
    target.scheduledTime,
    target.kanriNo,
  );
}

function applyTrackerStatus(
  trackerStatus: OperationStatusState,
  activeFlags: ActiveFlags,
  dependencyMasters: ReturnType<typeof getDependencyMasters>,
): void {
  updateStatus(
    evaluateTrackerStatus(trackerStatus, activeFlags, dependencyMasters),
  );
}

export async function syncReadyTrackerStatus(
  target: StatusTarget,
): Promise<void> {
  if (!hasTrackerTarget(target)) {
    return;
  }

  const kanriNo = normalizeKanriNo(target.kanriNo);

  if (getStatus(kanriNo)?.status !== JOB_STATUS.READY) {
    return;
  }

  const trackerStatus = await fetchTrackerStatus(target);

  if (!trackerStatus || shouldKeepReadyStatus(trackerStatus.status)) {
    return;
  }

  const activeFlags = getActiveFlags();
  const dependencyMasters = getDependencyMasters();

  applyTrackerStatus(trackerStatus, activeFlags, dependencyMasters);
}

async function evaluateTrackerTarget(
  target: OperationTarget,
): Promise<OperationStatusState | undefined> {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  const currentStatus = getStatus(kanriNo);

  if (!canSyncTrackerStatus(currentStatus?.status)) {
    return;
  }

  try {
    return await fetchTrackerStatus(target);
  } catch (error) {
    console.error(
      `[StatusEvaluator] Tracker同期エラー (kanriNo=${kanriNo}):`,
      error,
    );
  }
}

function applyLocalStatus(
  target: StatusTarget,
  activeFlags: ActiveFlags,
  dependencyMasters: ReturnType<typeof getDependencyMasters>,
): void {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  const currentStatus = getStatus(kanriNo);

  if (isProtectedStatus(currentStatus?.status)) {
    return;
  }

  updateStatus(
    calculateOperationStatus(
      target,
      dependencyMasters,
      getDependencyStatuses(),
      activeFlags,
    ),
  );
}

export async function syncStatuses(targets: StatusTarget[]): Promise<void> {
  const trackerTargets: OperationTarget[] = [];
  const localTargets: StatusTarget[] = [];

  for (const target of targets) {
    if (hasTrackerTarget(target)) {
      trackerTargets.push(target);
    } else {
      localTargets.push(target);
    }
  }

  const activeFlags = getActiveFlags();
  const dependencyMasters = getDependencyMasters();

  // 1. Tracker 対象を並列取得
  const trackerResults = await Promise.all(
    trackerTargets.map(async (target) => ({
      target,
      status: await evaluateTrackerTarget(target),
    })),
  );

  // 2. Tracker からステータスが取得できた場合はそれを適用、取得できない場合（SCHEDULED等）はローカル判定を実行
  for (const { target, status } of trackerResults) {
    if (status) {
      applyTrackerStatus(status, activeFlags, dependencyMasters);
    } else {
      applyLocalStatus(target, activeFlags, dependencyMasters);
    }
  }

  // 3. 最初から Tracker 対象外のタスクもローカル判定を実行
  for (const target of localTargets) {
    applyLocalStatus(target, activeFlags, dependencyMasters);
  }
}
