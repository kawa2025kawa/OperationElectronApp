// electron/features/operation/application/operationStatusEvaluator.ts

import { getActiveFlags } from "@electron/features/operation/application/activeFlagsManager";
import {
  getDependencyMasters,
  getDependencyStatuses,
  getStatus,
  getTargetByKanriNo,
  recalculateTargetStatus,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import { fetchTrackerStatusByJobId } from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";
import {
  getJobId,
  isValidTrackerJobId,
} from "@electron/features/operation/infrastructure/tracker/trackerHelper";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatDependencyWaitingComment,
  type DependencyMasters,
  type DependencyCheckResult,
} from "@shared/utils/dependency/dependencyUtils";

type OperationTarget = Extract<StatusTarget, { targetType: "operation" }>;

// Tracker連携対象であることを判定する。
function hasTrackerTarget(target: StatusTarget): target is OperationTarget {
  return (
    target.targetType === "operation" &&
    Boolean(target.kanriNo) &&
    Boolean(getJobId(target))
  );
}

// Trackerのステータスを同期できる状態か判定する。
function canSyncTrackerStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.READY || status === JOB_STATUS.RUNNING;
}

// TrackerからのREADY更新時に維持するローカル状態か判定する。
function shouldKeepReadyStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.SCHEDULED || status === JOB_STATUS.WAITING;
}

// TrackerのSUCCESSが前提作業の完了条件を満たすか確認する。
export function evaluateTrackerStatus(
  trackerStatus: OperationStatusState,
  activeFlags: ActiveFlags = getActiveFlags(),
  dependencyMasters: DependencyMasters = getDependencyMasters(),
): OperationStatusState {
  if (trackerStatus.status !== JOB_STATUS.SUCCESS) {
    return trackerStatus;
  }

  const dependencyResult: DependencyCheckResult = checkJobDependencies(
    trackerStatus.kanriNo,
    dependencyMasters,
    getDependencyStatuses(),
    activeFlags,
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

// Trackerから対象作業のステータスを取得する。
export async function fetchTrackerStatus(
  target: OperationTarget,
): Promise<OperationStatusState | undefined> {
  const jobId = target.jobId?.trim();

  if (!jobId) {
    return undefined;
  }

  return fetchTrackerStatusByJobId(jobId, target.scheduledTime, target.kanriNo);
}

/**
 * 管理番号を指定して Tracker のステータスを取得・反映する。
 */
export async function fetchSingleTrackerStatus(
  kanriNoInput: string,
): Promise<OperationStatusState> {
  const kanriNo = normalizeKanriNo(kanriNoInput);
  const target = getTargetByKanriNo(kanriNo);

  if (
    !target ||
    target.targetType !== "operation" ||
    !isValidTrackerJobId(target.jobId)
  ) {
    throw new Error(
      `Tracker target not found or Job ID is not configured (kanriNo=${kanriNo})`,
    );
  }

  const trackerStatus = await fetchTrackerStatus(target);

  if (!trackerStatus) {
    return {
      kanriNo,
      status: JOB_STATUS.ERROR,
      comment: "Trackerステータス取得失敗",
    };
  }

  applyTrackerStatus(trackerStatus);
  return trackerStatus;
}

// Trackerの取得結果を依存関係の判定後にステータスへ反映する。
export function applyTrackerStatus(
  trackerStatus: OperationStatusState,
  activeFlags: ActiveFlags = getActiveFlags(),
  dependencyMasters: DependencyMasters = getDependencyMasters(),
): void {
  updateStatus(
    evaluateTrackerStatus(trackerStatus, activeFlags, dependencyMasters),
  );
}

// READY対象のTrackerステータスを取得し、必要に応じて反映する。
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

// 同期可能な対象についてTrackerステータスを取得する。
async function evaluateTrackerTarget(
  target: OperationTarget,
): Promise<OperationStatusState | undefined> {
  const kanriNo = normalizeKanriNo(target.kanriNo);
  const currentStatus = getStatus(kanriNo);

  if (!canSyncTrackerStatus(currentStatus?.status)) {
    return undefined;
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

// Tracker連携対象とローカル対象のステータスを同期する。
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

  // Tracker対象のステータスを並行して取得する。
  const trackerResults = await Promise.all(
    trackerTargets.map(async (target) => ({
      target,
      status: await evaluateTrackerTarget(target),
    })),
  );

  // Trackerの取得結果を反映し、取得失敗時はローカルで再計算する。
  for (const { target, status } of trackerResults) {
    if (status) {
      applyTrackerStatus(status, activeFlags, dependencyMasters);
    } else {
      recalculateTargetStatus(target.kanriNo, activeFlags);
    }
  }

  // Tracker対象外のステータスをローカルで再計算する。
  for (const target of localTargets) {
    recalculateTargetStatus(target.kanriNo, activeFlags);
  }
}
