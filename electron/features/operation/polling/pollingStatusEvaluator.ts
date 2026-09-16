// electron/features/operation/polling/pollingStatusEvaluator.ts

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
import { getActiveFlags } from "@electron/features/operation/activeFlagsManager";
import { isPreviousDayJob } from "@electron/features/operation/helpers/trackerHelper";

const TERMINATED_STATUSES = new Set<string>([
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
): void {
  const now = new Date();
  const allEntities = getAllCurrentEntitiesMap(targets);
  const flags = getActiveFlags();
  const operationIds = Object.keys(allEntities);

  for (const target of targets) {
    if (!runningCheck()) return;

    const currentStatus = getStatus(target.kanriNo)?.status;

    // 終了済み、または実行中のジョブは評価をスキップ
    if (
      (currentStatus && TERMINATED_STATUSES.has(currentStatus)) ||
      currentStatus === JOB_STATUS.RUNNING ||
      currentStatus === JOB_STATUS.SCRIPT_RUNNING
    ) {
      continue;
    }

    const jobId =
      "jobId" in target &&
      typeof target.jobId === "string" &&
      target.jobId.trim()
        ? target.jobId.trim()
        : undefined;

    const isPrevDay = jobId ? isPreviousDayJob(jobId) : false;

    // ① 予定時刻を過ぎているか判定
    const timePassed = isScheduledTimePassed(
      target.scheduledTime,
      isPrevDay,
      now,
    );

    const hasDependency = Boolean(target.dependency);

    // ② 依存関係（例: No.44 が SUCCESS かどうか）を判定
    const depOk =
      !hasDependency ||
      checkJobDependencies(target.kanriNo, allEntities, flags, operationIds).ok;

    let nextStatus: Extract<JobStatus, "scheduled" | "waiting" | "ready">;

    // 🎯【厳格な3段階状態判定】
    if (!depOk) {
      // 1. 前提ジョブが完了していない ➔ SCHEDULED (予定)
      nextStatus = JOB_STATUS.SCHEDULED;
    } else if (!timePassed && target.scheduledTime?.trim()) {
      // 2. 前提ジョブはOKだが、まだ scheduledTime (例: 13:02) 前 ➔ WAITING (待合)
      nextStatus = JOB_STATUS.WAITING;
    } else {
      // 3. 前提ジョブもOK、かつ scheduledTime も通過した ➔ READY (実施可)
      nextStatus = JOB_STATUS.READY;
    }

    // ステータスに変化があった場合のみ更新（updateStatus 内で READY 遷移時に即時起動チェックが走る）
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
