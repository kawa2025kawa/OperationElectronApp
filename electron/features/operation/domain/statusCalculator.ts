// electron/features/operation/domain/statusCalculator.ts

import {
  isPreviousDayJob,
  normalizeKanriNo,
} from "@electron/features/operation/domain/operationRules";
import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationMaster,
  type OperationStatusState,
  type TodayIrregularMaster,
} from "@shared/types/operation/operationTypes";
import {
  checkJobDependencies,
  formatDependencyWaitingComment,
  normalizeDependencies,
  type DependencyMasters,
  type DependencyStatuses,
  type MissingDependency,
} from "@shared/utils/dependency/dependencyUtils";

export type StatusCalculationTarget = OperationMaster | TodayIrregularMaster;

interface StatusCalculationResult {
  status: JobStatus;
  comment: string;
}

interface ParsedTime {
  hours: number;
  minutes: number;
}

const READY_RESULT: Readonly<StatusCalculationResult> = Object.freeze({
  status: JOB_STATUS.READY,
  comment: "実施可能",
});

/**
 * 時刻文字列 (HH:mm) をパースして「時」と「分」を取得する。
 */
function parseHHMM(value?: string | null): ParsedTime | null {
  const match = value?.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

// 依存関係の有無に応じてジョブのステータス計算処理を振り分ける。
function calculateJobStatus(
  target: StatusCalculationTarget,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): StatusCalculationResult {
  const hasDependencies = normalizeDependencies(target.dependsOn).length > 0;

  if (!hasDependencies) {
    return calculateWithoutDependencies(target);
  }

  return calculateWithDependencies(target, masters, statuses, activeFlags);
}

// 計算結果から管理番号・ステータス・コメントを含む状態オブジェクトを生成する。
export function calculateOperationStatus(
  target: StatusCalculationTarget,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): OperationStatusState {
  const result = calculateJobStatus(target, masters, statuses, activeFlags);

  return {
    kanriNo: normalizeKanriNo(target.kanriNo),
    status: result.status,
    comment: result.comment,
  };
}

// 依存関係がないジョブについて予定時刻に基づくステータスを計算する。
function calculateWithoutDependencies(
  target: StatusCalculationTarget,
): StatusCalculationResult {
  if (isBeforeScheduledTime(target)) {
    return {
      status: JOB_STATUS.SCHEDULED,
      comment: `予定 (${target.scheduledTime})`,
    };
  }

  return READY_RESULT;
}

// 依存ジョブの状態と予定時刻に基づいてステータスを計算する。
function calculateWithDependencies(
  target: StatusCalculationTarget,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): StatusCalculationResult {
  const dependencyResult = checkJobDependencies(
    target.kanriNo,
    masters,
    statuses,
    activeFlags,
  );

  if (!dependencyResult.ok) {
    return createDependencyWaitingResult(dependencyResult.missingDependencies);
  }

  if (isBeforeScheduledTime(target)) {
    return {
      status: JOB_STATUS.WAITING,
      comment: `予定時刻待ち (${target.scheduledTime})`,
    };
  }

  return READY_RESULT;
}

// 未充足の依存関係を待機ステータスと説明コメントに変換する。
function createDependencyWaitingResult(
  missingDependencies: readonly MissingDependency[],
): StatusCalculationResult {
  return {
    status: JOB_STATUS.WAITING,
    comment: formatDependencyWaitingComment(missingDependencies),
  };
}

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
