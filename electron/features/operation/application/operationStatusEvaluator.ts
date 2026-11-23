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
import {
  isManualStatusDecisionJobId,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
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

function isTrackerPollingTarget(t: StatusTarget): t is OperationTarget {
  if (t.targetType !== "operation" || !normalizeKanriNo(t.kanriNo)) {
    return false;
  }

  const jobId = getJobId(t);
  if (!jobId) {
    return false;
  }

  return !isManualStatusDecisionJobId(jobId);
}

const canSyncTrackerStatus = (s?: JobStatus): boolean =>
  s === JOB_STATUS.READY || s === JOB_STATUS.RUNNING;

function evaluateTrackerStatus(
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

function applyTrackerStatus(
  trackerStatus: OperationStatusState,
): OperationStatusState {
  const evaluated = evaluateTrackerStatus(trackerStatus);
  updateStatus(evaluated);
  return evaluated;
}

async function fetchTrackerStatus(
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
  const jobId =
    target && target.targetType === "operation" ? getJobId(target) : undefined;

  if (!target || target.targetType !== "operation" || !jobId) {
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

  // ZCM8010 等: 手動JCで開始・終了時刻のみ反映し、Status自体はユーザーの手動操作でのみ決める
  if (isManualStatusDecisionJobId(jobId)) {
    const current = getStatus(kanriNo);
    const infoOnlyUpdate: OperationStatusState = {
      kanriNo,
      status: current?.status,
      startTime: trackerStatus.startTime ?? current?.startTime ?? null,
      endTime: trackerStatus.endTime ?? current?.endTime ?? null,
    };
    updateStatus(infoOnlyUpdate);
    return infoOnlyUpdate;
  }

  // 手動JC実行時は前提依存によるWAITING上書きを行わず、Tracker取得結果を直接反映する
  updateStatus(trackerStatus);
  return trackerStatus;
}

export async function syncReadyTrackerStatus(
  target: StatusTarget,
): Promise<void> {
  if (!isTrackerPollingTarget(target)) return;

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

      if (!isTrackerPollingTarget(target)) {
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