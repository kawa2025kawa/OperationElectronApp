// electron/features/operation/domain/status/statusCalculator.ts

import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
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
} from "@shared/utils/dependency/dependencyUtils";

import {
  isPreviousDayJob,
  parseHHMM,
} from "@electron/features/operation/helpers/operationUtils";

export type StatusCalculationTarget = OperationMaster | TodayIrregularMaster;

export interface StatusCalculationResult {
  status: JobStatus;
  comment: string;
}

export function calculateJobStatus(
  target: StatusCalculationTarget,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): StatusCalculationResult {
  const dependencies = normalizeDependencies(target.dependsOn);

  if (dependencies.length === 0) {
    return calculateWithoutDependencies(target);
  }

  return calculateWithDependencies(target, masters, statuses, activeFlags);
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
    return {
      status: JOB_STATUS.WAITING,
      comment: createDependencyWaitingComment(
        dependencyResult.missingDependencies,
      ),
    };
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

function createDependencyWaitingComment(
  missingDependencies: readonly {
    kanriNo: string;
  }[],
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

