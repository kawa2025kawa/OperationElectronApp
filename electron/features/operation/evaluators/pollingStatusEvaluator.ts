//electron\features\operation\evaluators\pollingStatusEvaluator.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";

import { checkJobDependencies } from "@renderer/features/operation/helpers/dependencyHelper";
import { isScheduledTimePassed } from "@electron/features/operation/helpers/scheduledTimeCheck";
import {
  getMergedEntity,
  getStatus,
  updateStatus,
} from "@electron/features/operation/statusManager";

const IGNORED_STATUSES = new Set<string>([
  JOB_STATUS.RUNNING,
  JOB_STATUS.SCRIPT_RUNNING,
  JOB_STATUS.SUCCESS,
  JOB_STATUS.ERROR,
]);

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

  // activeFlags が指定されていない場合のデフォルト（全拠点有効とみなす）
  const flags = activeFlags ?? {
    is1CActive: true,
    is2CActive: true,
    is3CActive: true,
  };

  for (const target of targets) {
    if (!runningCheck()) return;

    const currentStatus = getStatus(target.kanriNo)?.status;
    if (currentStatus && IGNORED_STATUSES.has(currentStatus)) continue;

    // 1. 依存関係ルールのチェック
    let hasUnmetDependency = false;
    if (target.dependency) {
      const depResult = checkJobDependencies(
        target.kanriNo,
        allEntities,
        flags,
      );
      if (!depResult.ok) {
        hasUnmetDependency = true;
      }
    }

    let nextStatus: Extract<JobStatus, "scheduled" | "waiting" | "ready">;

    if (hasUnmetDependency) {
      // 依存未解除 ➔ scheduled
      nextStatus = JOB_STATUS.SCHEDULED;
    } else {
      // 2. 時刻のチェック
      const jobId =
        "jobId" in target && typeof target.jobId === "string"
          ? target.jobId
          : undefined;
      const timePassed = isScheduledTimePassed(
        target.scheduledTime,
        jobId,
        now,
      );

      if (!timePassed && target.scheduledTime?.trim()) {
        // 時刻未到来 ➔ waiting
        nextStatus = JOB_STATUS.WAITING;
      } else {
        // 時刻経過済み または 指定なし ➔ ready
        nextStatus = JOB_STATUS.READY;
      }
    }

    if (currentStatus !== nextStatus) {
      updateStatus({
        kanriNo: target.kanriNo,
        status: nextStatus,
      });
    }
  }
}
