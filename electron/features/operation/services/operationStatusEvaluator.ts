// electron/features/operation/services/operationStatusEvaluator.ts

import { getActiveFlags } from "@electron/features/operation/activeFlagsManager";
import { normalizeKanriNo } from "@electron/features/operation/helpers/operationUtils";
import { getDependencyMasters } from "@electron/features/operation/services/operationMasterService";
import {
  fetchTrackerStatusByJobId,
  hasJobId,
} from "@electron/features/operation/services/trackerServiceClient";
import {
  getDependencyStatuses,
  getStatus,
  updateStatus,
  type StatusTarget,
} from "@electron/features/operation/statusManager";

import {
  JOB_STATUS,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import {
  checkJobDependencies,
  type DependencyCheckResult,
} from "@shared/utils/dependency/dependencyUtils";

import type { OperationMaster } from "@shared/types/spreadsheet/spreadsheetTypes";

function isOperationMaster(target: StatusTarget): target is OperationMaster {
  return "jobId" in target;
}

function hasTrackerTarget(target: StatusTarget): target is OperationMaster {
  return (
    isOperationMaster(target) && Boolean(target.kanriNo) && hasJobId(target)
  );
}

function canSyncTrackerStatus(status?: JobStatus): boolean {
  return (
    status !== JOB_STATUS.RUNNING &&
    status !== JOB_STATUS.SCRIPT_RUNNING &&
    status !== JOB_STATUS.SUCCESS &&
    status !== JOB_STATUS.ERROR
  );
}

function shouldKeepReadyStatus(status?: JobStatus): boolean {
  return status === JOB_STATUS.SCHEDULED || status === JOB_STATUS.WAITING;
}

function checkDependencies(kanriNo: string): DependencyCheckResult {
  return checkJobDependencies(
    kanriNo,
    getDependencyMasters(),
    getDependencyStatuses(),
    getActiveFlags(),
  );
}

function evaluateTrackerStatus(
  trackerStatus: OperationStatusState,
): OperationStatusState {
  if (trackerStatus.status !== JOB_STATUS.SUCCESS) {
    return trackerStatus;
  }

  const dependencyResult = checkDependencies(trackerStatus.kanriNo);

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
  target: OperationMaster,
): Promise<OperationStatusState | undefined> {
  return fetchTrackerStatusByJobId(
    target.jobId,
    target.scheduledTime,
    target.kanriNo,
  );
}

function applyTrackerStatus(trackerStatus: OperationStatusState): void {
  updateStatus(evaluateTrackerStatus(trackerStatus));
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

  if (!trackerStatus) {
    return;
  }

  if (shouldKeepReadyStatus(trackerStatus.status)) {
    return;
  }

  applyTrackerStatus(trackerStatus);
}

function shouldSyncTarget(target: StatusTarget): target is OperationMaster {
  if (!hasTrackerTarget(target)) {
    return false;
  }

  return canSyncTrackerStatus(getStatus(target.kanriNo)?.status);
}

export async function syncTrackerStatuses(
  targets: StatusTarget[],
): Promise<void> {
  const syncTargets = targets.filter(shouldSyncTarget);

  if (syncTargets.length === 0) {
    return;
  }

  await Promise.all(
    syncTargets.map(async (target) => {
      try {
        const trackerStatus = await fetchTrackerStatus(target);

        if (trackerStatus) {
          applyTrackerStatus(trackerStatus);
        }
      } catch (error) {
        const kanriNo = normalizeKanriNo(target.kanriNo);

        console.error(
          `[StatusEvaluator] Tracker同期エラー (kanriNo=${kanriNo}):`,
          error,
        );
      }
    }),
  );
}

