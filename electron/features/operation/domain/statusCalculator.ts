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

// 指定された現在時刻が予定時刻より前かどうかを判定する。
function isBeforeScheduledTime(
  target: StatusCalculationTarget,
  now: Date = new Date(),
): boolean {
  const scheduledTime = parseHHMM(target.scheduledTime);
  if (!scheduledTime) {
    return false;
  }

  const targetDate = new Date(now);
  targetDate.setHours(scheduledTime.hours, scheduledTime.minutes, 0, 0);

  if (isPreviousDayJob(target.kanriNo, target.scheduledTime)) {
    targetDate.setDate(targetDate.getDate() - 1);
  }

  return now < targetDate;
}

/**
 * 依存関係と予定時刻からジョブの最新ステータスを計算する。
 * 無駄な中間オブジェクトの二重生成を排除し直接 OperationStatusState を返す。
 */
export function calculateOperationStatus(
  target: StatusCalculationTarget,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
  now: Date = new Date(),
): OperationStatusState {
  const kanriNo = normalizeKanriNo(target.kanriNo);

  // 1. 前提作業（依存関係）のチェック
  const dependencyResult = checkJobDependencies(
    target.kanriNo,
    masters,
    statuses,
    activeFlags,
  );

  if (!dependencyResult.ok) {
    return {
      kanriNo,
      status: JOB_STATUS.WAITING,
      comment: formatDependencyWaitingComment(
        dependencyResult.missingDependencies,
      ),
    };
  }

  // 2. 予定時刻到達のチェック
  if (isBeforeScheduledTime(target, now)) {
    const isWaitingDep = dependencyResult.dependencies.length > 0;
    return {
      kanriNo,
      status: isWaitingDep ? JOB_STATUS.WAITING : JOB_STATUS.SCHEDULED,
      comment: isWaitingDep
        ? `予定時刻待ち (${target.scheduledTime})`
        : `予定 (${target.scheduledTime})`,
    };
  }

  // 3. 実施可能
  return {
    kanriNo,
    status: JOB_STATUS.READY,
    comment: "実施可能",
  };
}
