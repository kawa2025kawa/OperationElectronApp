// src/shared/utils/dependency/dependencyUtils.ts

import {
  JOB_STATUS,
  type ActiveFlags,
  type JobStatus,
  type JobDependency,
  type OperationItem,
} from "@shared/types/operation/operationTypes";

export interface MissingDependency {
  kanriNo: string;
  status: JobStatus | null | undefined;
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

export const DEFAULT_JOB_EXECUTION_OPTIONS: JobExecutionOptions = {
  ignoreDependencies: false,
  silent: true,
};

/**
 * dependsOn の値を ID 配列 (string[]) へ正規化
 */
export function normalizeDependencies(rawDependsOn: unknown): string[] {
  if (rawDependsOn == null) return [];
  const sourceArray = Array.isArray(rawDependsOn)
    ? rawDependsOn
    : [String(rawDependsOn)];

  return sourceArray
    .flatMap((item) => String(item).split(","))
    .map((id) => id.trim())
    .filter((id) => id !== "" && id !== "-");
}

const buildResult = (
  ok: boolean,
  missingDependencies: MissingDependency[] = [],
): DependencyCheckResult => ({
  ok,
  missingDependencies,
});

export function checkDependsOn(
  dependency: JobDependency,
  entities: Record<string, OperationItem>,
): DependencyCheckResult {
  const validDependsOn = normalizeDependencies(dependency?.dependsOn);
  if (validDependsOn.length === 0) {
    return buildResult(true);
  }

  const missingDependencies: MissingDependency[] = [];
  for (const depKanriNo of validDependsOn) {
    const entity = entities[depKanriNo];
    const currentStatus = entity?.status;

    if (currentStatus !== JOB_STATUS.SUCCESS) {
      missingDependencies.push({
        kanriNo: depKanriNo,
        status: (entity?.status as JobStatus) ?? null,
        comment: entity?.comment ?? `前提 No.${depKanriNo} 未完了`,
      });
    }
  }

  return missingDependencies.length === 0
    ? buildResult(true)
    : buildResult(false, missingDependencies);
}

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  _activeFlags?: ActiveFlags,
  _operationIds?: string[],
): DependencyCheckResult {
  const targetKanriNo = String(kanriNo).trim();
  const targetEntity = entities[targetKanriNo];
  const dependency = targetEntity?.dependency;
  if (!dependency) return buildResult(true);

  return checkDependsOn(dependency, entities);
}

export function validateJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  options: JobExecutionOptions = DEFAULT_JOB_EXECUTION_OPTIONS,
  activeFlags?: ActiveFlags,
  operationIds?: string[],
): ValidationResult {
  if (options.ignoreDependencies) return { ok: true };

  const result = checkJobDependencies(
    kanriNo,
    entities,
    activeFlags,
    operationIds,
  );

  if (result.ok) return { ok: true };

  const message =
    result.missingDependencies
      .map(({ kanriNo: depKanriNo, comment }) =>
        comment ? `No.${depKanriNo}: ${comment}` : `No.${depKanriNo}: 未完了`,
      )
      .join("\n") || "前提ジョブが完了していません";

  return { ok: false, message };
}
