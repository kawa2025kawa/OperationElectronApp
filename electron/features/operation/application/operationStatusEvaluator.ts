// electron/features/operation/application/operationStatusEvaluator.ts

import { getActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  getDependencyMasters,
  getDependencyStatuses,
  getStatus,
  recalculateTargetStatus,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { fetchTrackerStatusByJobId } from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";
import { getJobId } from "@electron/features/operation/infrastructure/tracker/trackerHelper";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatDependencyWaitingComment,
  type DependencyCheckResult,
} from "@shared/utils/dependency/dependencyUtils";

type OperationTarget = Extract<StatusTarget, { targetType: "operation" }>;

function hasTrackerTarget(target: StatusTarget): target is OperationTarget {
  return (
    target.targetType === "operation" &&
    Boolean(target.kanriNo) &&
    Boolean(getJobId(target))
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

export function evaluateTrackerStatus(
  trackerStatus: OperationStatusState,
  activeFlags: ActiveFlags = getActiveFlags(),
  dependencyMasters: ReturnType<
    typeof getDependencyMasters
  > = getDependencyMasters(),
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

  return {
    ...trackerStatus,
    status: JOB_STATUS.WAITING,
    comment: formatDependencyWaitingComment(
      dependencyResult.missingDependencies,
    ),
  };
}

export async function fetchTrackerStatus(
  target: OperationTarget,
): Promise<OperationStatusState | undefined> {
  const jobId = target.jobId?.trim();
  if (!jobId) {
    return undefined;
  }

  return fetchTrackerStatusByJobId(jobId, target.scheduledTime, target.kanriNo);
}

export function applyTrackerStatus(
  trackerStatus: OperationStatusState,
  activeFlags: ActiveFlags = getActiveFlags(),
  dependencyMasters: ReturnType<
    typeof getDependencyMasters
  > = getDependencyMasters(),
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

  applyTrackerStatus(trackerStatus);
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
      `[StatusEvaluator] Tracker 連携エラー (kanriNo=${kanriNo}):`,
      error,
    );
    return undefined;
  }
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

  // 1. Tracker 対象のステータスを取得
  const trackerResults = await Promise.all(
    trackerTargets.map(async (target) => ({
      target,
      status: await evaluateTrackerTarget(target),
    })),
  );

  // 2. Tracker 結果を反映（取得失敗時はローカル計算）
  for (const { target, status } of trackerResults) {
    if (status) {
      applyTrackerStatus(status, activeFlags, dependencyMasters);
    } else {
      recalculateTargetStatus(target.kanriNo, activeFlags);
    }
  }

  // 3. Tracker 対象外のステータスを計算
  for (const target of localTargets) {
    recalculateTargetStatus(target.kanriNo, activeFlags);
  }
}
