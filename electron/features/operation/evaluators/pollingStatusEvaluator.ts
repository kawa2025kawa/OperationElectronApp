// electron/features/operation/evaluators/pollingStatusEvaluator.ts

import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";

import { checkJobDependencies } from "@shared/utils/dependencyHelper";
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

  const flags = activeFlags ?? {
    is1CActive: true,
    is2CActive: true,
    is3CActive: true,
  };

  for (const target of targets) {
    if (!runningCheck()) return;

    const currentStatus = getStatus(target.kanriNo)?.status;
    if (currentStatus && IGNORED_STATUSES.has(currentStatus)) continue;

    const jobId =
      "jobId" in target && typeof target.jobId === "string"
        ? target.jobId
        : undefined;
    const timePassed = isScheduledTimePassed(target.scheduledTime, jobId, now);

    let nextStatus: Extract<JobStatus, "scheduled" | "waiting" | "ready">;

    if (target.dependency) {
      // 1. 依存関係が存在するジョブ
      const depResult = checkJobDependencies(
        target.kanriNo,
        allEntities,
        flags,
      );

      if (!depResult.ok) {
        // 依存未解除 ➔ 予定 (scheduled)
        nextStatus = JOB_STATUS.SCHEDULED;
      } else if (!timePassed && target.scheduledTime?.trim()) {
        // 依存クリア ＆ 予定時刻未到来 ➔ 待合 (waiting)
        nextStatus = JOB_STATUS.WAITING;
      } else {
        // 依存クリア ＆ 予定時刻経過/指定なし ➔ 実行準備完了 (ready)
        nextStatus = JOB_STATUS.READY;
      }
    } else {
      // 2. 依存関係が存在しないジョブ
      if (!timePassed && target.scheduledTime?.trim()) {
        // 予定時刻未到来 ➔ 予定 (scheduled)
        nextStatus = JOB_STATUS.SCHEDULED;
      } else {
        // 予定時刻経過/指定なし ➔ 実行準備完了 (ready)
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
