// electron/features/operation/domain/statusCalculator.ts

import {
  isPreviousDayJob,
  normalizeKanriNo,
  parseHHMM,
} from "@electron/features/operation/domain/operationRules";
import {
  JOB_STATUS,
  type ActiveFlags,
  type OperationMaster,
  type OperationStatusState,
  type TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatDependencyWaitingComment,
  type DependencyMasters,
  type DependencyStatuses,
} from "@electron/features/operation/domain/dependencyUtils";

export type StatusCalculationTarget = OperationMaster | TodayIrregularMaster;

function isBeforeScheduledTime(
  target: StatusCalculationTarget,
  now: Date = new Date(),
): boolean {
  const time = parseHHMM(target.scheduledTime);
  if (!time) return false;

  const targetDate = new Date(now);
  targetDate.setHours(time.hours, time.minutes, 0, 0);
  if (isPreviousDayJob(target.kanriNo, target.scheduledTime)) {
    targetDate.setDate(targetDate.getDate() - 1);
  }
  return now < targetDate;
}

export function calculateOperationStatus(
  target: StatusCalculationTarget,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
  now: Date = new Date(),
): OperationStatusState {
  const kanriNo = normalizeKanriNo(target.kanriNo);

  // 1. 前提作業（依存関係）チェック
  const depResult = checkJobDependencies(
    target.kanriNo,
    masters,
    statuses,
    activeFlags,
  );
  if (!depResult.ok) {
    return {
      kanriNo,
      status: JOB_STATUS.WAITING,
      comment: formatDependencyWaitingComment(depResult.missingDependencies),
    };
  }

  // 2. 予定時刻到達チェック
  if (isBeforeScheduledTime(target, now)) {
    const hasDeps = depResult.dependencies.length > 0;
    return {
      kanriNo,
      status: hasDeps ? JOB_STATUS.WAITING : JOB_STATUS.SCHEDULED,
      comment: hasDeps
        ? `予定時刻待ち (${target.scheduledTime})`
        : `予定 (${target.scheduledTime})`,
    };
  }

  // 3. 実施可能
  return { kanriNo, status: JOB_STATUS.READY, comment: "実施可能" };
}
