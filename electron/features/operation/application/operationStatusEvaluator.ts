// electron/features/operation/application/operationStatusEvaluator.ts

import {
  getActiveFlags,
  getDependencyMasters,
  getDependencyStatuses,
  getStatus,
  getTargetByKanriNo,
  recalculateTargetStatus,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/application/statusManager";
import { normalizeKanriNo } from "@electron/features/operation/domain/operationRules";
import {
  fetchTrackerStatusByJobId,
  getJobId,
} from "@electron/features/operation/infrastructure/tracker/trackerServiceClient";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatDependencyWaitingComment,
} from "@electron/features/operation/domain/dependencyUtils";

type OperationTarget = Extract<StatusTarget, { targetType: "operation" }>;

const isTrackerTarget = (t: StatusTarget): t is OperationTarget =>
  t.targetType === "operation" &&
  Boolean(normalizeKanriNo(t.kanriNo)) &&
  Boolean(getJobId(t));

const canSyncTrackerStatus = (s?: JobStatus): boolean =>
  s === JOB_STATUS.READY || s === JOB_STATUS.RUNNING;

export function evaluateTrackerStatus(
  trackerStatus: OperationStatusState,
): OperationStatusState {
  if (trackerStatus.status !== JOB_STATUS.SUCCESS) return trackerStatus;

  const depResult = checkJobDependencies(
    trackerStatus.kanriNo,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );

  return depResult.ok
    ? trackerStatus
    : {
        ...trackerStatus,
        status: JOB_STATUS.WAITING,
        comment: formatDependencyWaitingComment(depResult.missingDependencies),
      };
}

export function applyTrackerStatus(
  trackerStatus: OperationStatusState,
): OperationStatusState {
  const evaluated = evaluateTrackerStatus(trackerStatus);
  updateStatus(evaluated);
  return evaluated;
}

export async function fetchTrackerStatus(
  target: OperationTarget,
): Promise<OperationStatusState | undefined> {
  const jobId = getJobId(target);
  return jobId
    ? fetchTrackerStatusByJobId(jobId, target.scheduledTime, target.kanriNo)
    : undefined;
}

export async function fetchSingleTrackerStatus(
  kanriNoInput: string,
): Promise<OperationStatusState> {
  const kanriNo = normalizeKanriNo(kanriNoInput);
  const target = getTargetByKanriNo(kanriNo);

  if (!target || target.targetType !== "operation" || !getJobId(target)) {
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

  return applyTrackerStatus(trackerStatus);
}

export async function syncReadyTrackerStatus(
  target: StatusTarget,
): Promise<void> {
  if (!isTrackerTarget(target)) return;

  const kanriNo = normalizeKanriNo(target.kanriNo);
  if (getStatus(kanriNo)?.status !== JOB_STATUS.READY) return;

  const trackerStatus = await fetchTrackerStatus(target);
  if (
    !trackerStatus ||
    trackerStatus.status === JOB_STATUS.SCHEDULED ||
    trackerStatus.status === JOB_STATUS.WAITING
  ) {
    return;
  }

  applyTrackerStatus(trackerStatus);
}

export async function syncStatuses(targets: StatusTarget[]): Promise<void> {
  const activeFlags = getActiveFlags();

  await Promise.all(
    targets.map(async (target) => {
      const kanriNo = normalizeKanriNo(target.kanriNo);
      if (!kanriNo) return;

      if (!isTrackerTarget(target)) {
        recalculateTargetStatus(kanriNo, activeFlags);
        return;
      }

      if (!canSyncTrackerStatus(getStatus(kanriNo)?.status)) return;

      try {
        const trackerStatus = await fetchTrackerStatus(target);
        if (trackerStatus) {
          applyTrackerStatus(trackerStatus);
          return;
        }
      } catch (error) {
        console.error(
          `[StatusEvaluator] Tracker連携エラー (kanriNo=${kanriNo}):`,
          error,
        );
      }

      recalculateTargetStatus(kanriNo, activeFlags);
    }),
  );
}
