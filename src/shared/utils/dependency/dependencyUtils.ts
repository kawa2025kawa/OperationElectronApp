// src/shared/utils/dependency/dependencyUtils.ts

import {
  type ActiveFlags,
  type JobStatus,
  type OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type {
  OperationMaster,
  IrregularMaster,
  TodayIrregularMaster,
} from "@shared/types/spreadsheet/spreadsheetTypes";
import { isSuccessStatus } from "@shared/utils/statusUtils";

export type MasterItem =
  | OperationMaster
  | IrregularMaster
  | TodayIrregularMaster;

export interface MissingDependency {
  kanriNo: string;
  status: JobStatus | null;
  comment: string;
}

export interface DependencyCheckResult {
  ok: boolean;
  missingDependencies: MissingDependency[];
}

export interface JobExecutionOptions {
  ignoreDependencies?: boolean;
  silent?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

export interface DependencyMasters {
  operationMasters: OperationMaster[];
  irregularMasters: IrregularMaster[];
  todayIrregularMasters: TodayIrregularMaster[];
}

export interface DependencyStatuses {
  operationStatuses: Record<string, OperationStatusState>;
  irregularStatuses: Record<string, OperationStatusState>;
  todayStatuses: Record<string, OperationStatusState>;
}

const DEFAULT_JOB_EXECUTION_OPTIONS: Readonly<JobExecutionOptions> = {
  ignoreDependencies: false,
  silent: true,
};

const CENTER_DEPENDENCY_KEYS: Readonly<Record<string, keyof ActiveFlags>> = {
  "1C": "is1CActive",
  "2C": "is2CActive",
  "3C": "is3CActive",
};

const EMPTY_CHECK_RESULT: DependencyCheckResult = {
  ok: true,
  missingDependencies: [],
};

function getMasterLists(masters: DependencyMasters): readonly MasterItem[][] {
  return [
    masters.operationMasters,
    masters.irregularMasters,
    masters.todayIrregularMasters,
  ];
}

function findMaster(
  kanriNo: string,
  masters: DependencyMasters,
): MasterItem | undefined {
  const key = kanriNo.trim();

  for (const mastersList of getMasterLists(masters)) {
    const master = mastersList.find((item) => item.kanriNo.trim() === key);

    if (master) {
      return master;
    }
  }

  return undefined;
}

function findStatus(
  kanriNo: string,
  statuses: DependencyStatuses,
): OperationStatusState | undefined {
  const key = kanriNo.trim();

  return (
    statuses.operationStatuses[key] ??
    statuses.irregularStatuses[key] ??
    statuses.todayStatuses[key]
  );
}

function checkCenterDependency(
  dependency: string,
  activeFlags?: ActiveFlags,
): MissingDependency | undefined {
  const activeKey = CENTER_DEPENDENCY_KEYS[dependency];

  if (!activeKey || activeFlags?.[activeKey] === true) {
    return undefined;
  }

  return {
    kanriNo: dependency,
    status: null,
    comment: `${dependency} が未アクティブ`,
  };
}

function createMissingDependency(
  dependency: string,
  master: MasterItem | undefined,
  status: OperationStatusState | undefined,
): MissingDependency {
  return {
    kanriNo: dependency,
    status: status?.status ?? null,
    comment:
      status?.comment ??
      (master
        ? `前提 No.${dependency} 未完了`
        : `前提 No.${dependency} が存在しません`),
  };
}

function checkDependency(
  dependency: string,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): MissingDependency | undefined {
  const centerMissing = checkCenterDependency(dependency, activeFlags);

  if (centerMissing) {
    return centerMissing;
  }

  const master = findMaster(dependency, masters);
  const status = findStatus(dependency, statuses);

  if (isSuccessStatus(status?.status)) {
    return undefined;
  }

  return createMissingDependency(dependency, master, status);
}

function checkDependencies(
  dependencies: string[],
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): DependencyCheckResult {
  if (dependencies.length === 0) {
    return EMPTY_CHECK_RESULT;
  }

  const missingDependencies = dependencies
    .map((dependency) =>
      checkDependency(dependency, masters, statuses, activeFlags),
    )
    .filter(
      (dependency): dependency is MissingDependency => dependency !== undefined,
    );

  return {
    ok: missingDependencies.length === 0,
    missingDependencies,
  };
}

export function normalizeDependencies(rawDependsOn: unknown): string[] {
  if (rawDependsOn == null) {
    return [];
  }

  const values = Array.isArray(rawDependsOn) ? rawDependsOn : [rawDependsOn];

  return values
    .map(String)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function checkJobDependencies(
  kanriNo: string,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  activeFlags?: ActiveFlags,
): DependencyCheckResult {
  const target = findMaster(kanriNo, masters);

  if (!target) {
    return EMPTY_CHECK_RESULT;
  }

  return checkDependencies(
    normalizeDependencies(target.dependsOn),
    masters,
    statuses,
    activeFlags,
  );
}

export function validateJobDependencies(
  kanriNo: string,
  masters: DependencyMasters,
  statuses: DependencyStatuses,
  options: JobExecutionOptions = DEFAULT_JOB_EXECUTION_OPTIONS,
  activeFlags?: ActiveFlags,
): ValidationResult {
  if (options.ignoreDependencies) {
    return { ok: true };
  }

  const result = checkJobDependencies(kanriNo, masters, statuses, activeFlags);

  if (result.ok) {
    return { ok: true };
  }

  const message =
    result.missingDependencies
      .map(({ kanriNo: id, comment }) => `No.${id}: ${comment || "未完了"}`)
      .join("\n") || "前提ジョブが完了していません";

  return {
    ok: false,
    message,
  };
}
