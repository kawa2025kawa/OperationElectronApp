// electron/features/operation/domain/status/statusCalculator.ts

import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";

import type {
  OperationMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";

import {
  checkJobDependencies,
  normalizeDependencies,
  type DependencyMasters,
  type DependencyStatuses,
  type MissingDependency,
} from "@shared/utils/dependency/dependencyUtils";

import { isPreviousDayJob } from "@electron/features/operation/domain/operationRules";
import { parseHHMM } from "@electron/features/operation/utils/operationUtils";

export type StatusCalculationTarget = OperationMaster | TodayIrregularMaster;

interface StatusCalculationResult {
  status: JobStatus;
  comment: string;
}

export function calculateJobStatus(
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

export function calculateOperationStatus(
  target: StatusCalculationTarget,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): OperationStatusState {
  const result = calculateJobStatus(target, masters, statuses, activeFlags);

  return {
    kanriNo: target.kanriNo,
    status: result.status,
    comment: result.comment,
  };
}

function calculateWithoutDependencies(
  target: StatusCalculationTarget,
): StatusCalculationResult {
  if (isBeforeScheduledTime(target)) {
    return {
      status: JOB_STATUS.SCHEDULED,
      comment: `予定 (${target.scheduledTime})`,
    };
  }

  return {
    status: JOB_STATUS.READY,
    comment: "実施可能",
  };
}

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

  return {
    status: JOB_STATUS.READY,
    comment: "実施可能",
  };
}

function createDependencyWaitingResult(
  missingDependencies: readonly MissingDependency[],
): StatusCalculationResult {
  return {
    status: JOB_STATUS.WAITING,
    comment: createDependencyWaitingComment(missingDependencies),
  };
}

function createDependencyWaitingComment(
  missingDependencies: readonly MissingDependency[],
): string {
  const missingKanriNos = missingDependencies
    .map(({ kanriNo }) => kanriNo)
    .filter(Boolean);

  if (missingKanriNos.length === 0) {
    return "前提未完了";
  }

  return `前提未完了(No.${missingKanriNos.join(", ")})`;
}

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
