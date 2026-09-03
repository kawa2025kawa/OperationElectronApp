// electron/features/operation/evaluators/pollingStatusEvaluator.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation";
import { checkJobDependencies } from "@shared/utils/dependencyHelper";
import { isScheduledTimePassed } from "@shared/utils/dateUtils";
import {
  getMergedEntity,
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";
import { isPreviousDayJob } from "@electron/features/operation/helpers/trackerUrlHelper";

const IGNORED_STATUSES = new Set<string>([
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.ERROR,
]);

const DEFAULT_ACTIVE_FLAGS = {
  is1CActive: true,
  is2CActive: true,
  is3CActive: true,
};

function getAllCurrentEntitiesMap(
  targets: OperationItem[],
): Record<string, OperationItem> {
  const map: Record<string, OperationItem> = {};
  for (const target of targets) {
    const merged = getMergedEntity(target);
    map[merged.kanriNo] = merged;
  }
  return map;
}

export function evaluateAllTargetStatuses(
  targets: OperationItem[],
  runningCheck: () => boolean,
  activeFlags?: Record<string, boolean>,
): void {
  const now = new Date();
  const allEntities = getAllCurrentEntitiesMap(targets);
  const flags = activeFlags ?? DEFAULT_ACTIVE_FLAGS;

  for (const target of targets) {
    if (!runningCheck()) return;

    const currentStatus = getStatus(target.kanriNo)?.status;
    if (currentStatus && IGNORED_STATUSES.has(currentStatus)) continue;

    const jobId =
      target.kind === "operation" && typeof target.jobId === "string"
        ? target.jobId
        : undefined;
    const isPrevDay = jobId ? isPreviousDayJob(jobId) : false;
    const timePassed = isScheduledTimePassed(
      target.scheduledTime,
      isPrevDay,
      now,
    );

    const hasDependency = Boolean(target.dependency);
    const depOk =
      !hasDependency ||
      checkJobDependencies(target.kanriNo, allEntities, flags).ok;

    let nextStatus: Extract<JobStatus, "scheduled" | "waiting" | "ready">;

    if (!depOk) {
      nextStatus = JOB_STATUS.SCHEDULED;
    } else if (!timePassed && target.scheduledTime?.trim()) {
      nextStatus = hasDependency ? JOB_STATUS.WAITING : JOB_STATUS.SCHEDULED;
    } else {
      nextStatus = JOB_STATUS.READY;
    }

    if (currentStatus !== nextStatus) {
      updateStatus({
        kanriNo: target.kanriNo,
        status: nextStatus,
      });

      if (allEntities[target.kanriNo]) {
        allEntities[target.kanriNo].status = nextStatus;
      }
    }
  }
}
