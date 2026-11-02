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

// Tracker連携対象判定
function isTrackerTarget(target: StatusTarget): target is OperationTarget {
  return (
    target.targetType === "operation" &&
    Boolean(normalizeKanriNo(target.kanriNo)) &&
    Boolean(getJobId(target))
  );
}

// 同期可能なステータス判定
function canSyncTrackerStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.READY || status === JOB_STATUS.RUNNING;
}

// TrackerのSUCCESS判定と前提依存の評価を一元処理
export function evaluateTrackerStatus(
  trackerStatus: OperationStatusState,
): OperationStatusState {
  if (trackerStatus.status !== JOB_STATUS.SUCCESS) {
    return trackerStatus;
  }

  const dependencyResult = checkJobDependencies(
    trackerStatus.kanriNo,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
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

// Trackerステータスの評価と更新を一括適用
export function applyTrackerStatus(
  trackerStatus: OperationStatusState,
): OperationStatusState {
  const evaluatedStatus = evaluateTrackerStatus(trackerStatus);
  updateStatus(evaluatedStatus);
  return evaluatedStatus;
}

// 対象のTrackerステータスを取得
export async function fetchTrackerStatus(
  target: OperationTarget,
): Promise<OperationStatusState | undefined> {
  const jobId = getJobId(target);
  if (!jobId) return undefined;

  return fetchTrackerStatusByJobId(jobId, target.scheduledTime, target.kanriNo);
}

// 管理番号を指定して単一ターゲットのTrackerステータスを取得・適用
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

// READY状態のTrackerターゲットを同期
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

// 全ターゲットのステータス同期（中間配列・二重評価を全廃）
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

      if (!canSyncTrackerStatus(getStatus(kanriNo)?.status)) {
        return;
      }

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

      // Tracker取得失敗時はローカル再判定
      recalculateTargetStatus(kanriNo, activeFlags);
    }),
  );
}
