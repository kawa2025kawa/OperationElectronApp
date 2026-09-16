// src/shared/utils/dependencyHelper.ts

import type {
  ActiveFlags,
  JobDependency,
  JobStatus,
  OperationItem,
} from "@shared/types/operation";

// ============================================================================
// Types & Constants
// ============================================================================

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

export const DEFAULT_JOB_EXECUTION_OPTIONS: Readonly<JobExecutionOptions> = {
  ignoreDependencies: true,
  silent: true,
};

const DEFAULT_REQUIRED_STATUS = "success";

// ============================================================================
// Internal Helpers
// ============================================================================

const normalize = (val: string | number) => String(val).trim();

const res = (
  ok: boolean,
  missingDependencies: MissingDependency[] = [],
): DependencyCheckResult => ({
  ok,
  missingDependencies,
});

function getRequiredStatuses(
  dependency: JobDependency,
  kanriNo: string,
): string[] {
  const req = dependency.requiredStatus;
  if (!req) return [DEFAULT_REQUIRED_STATUS];

  const statuses = Array.isArray(req) ? req : req[kanriNo];
  if (!statuses || statuses.length === 0) return [DEFAULT_REQUIRED_STATUS];

  return statuses.map((s) => String(s).toLowerCase());
}

// ============================================================================
// Dependency Checks
// ============================================================================

function checkRequiredActiveFlags(
  dependency: JobDependency,
  activeFlags?: ActiveFlags,
): DependencyCheckResult {
  if (!dependency.requiresActive?.length) return res(true);
  if (!activeFlags) return res(false);

  const isActive = dependency.requiresActive.every((key) =>
    Boolean(activeFlags[key as keyof ActiveFlags]),
  );
  return res(isActive);
}

function checkAfterTime(
  kanriNo: string,
  dependency: JobDependency,
  targetEntity?: OperationItem,
): DependencyCheckResult {
  if (!dependency.afterTime) return res(true);

  const match = /^(\d{1,2}):(\d{2})$/.exec(dependency.afterTime);
  if (!match) {
    return res(false, [
      {
        kanriNo,
        status: targetEntity?.status,
        comment: `実行可能時間の設定が不正です: ${dependency.afterTime}`,
      },
    ]);
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = Number(match[1]) * 60 + Number(match[2]);

  if (currentMinutes >= targetMinutes) return res(true);

  return res(false, [
    {
      kanriNo,
      status: targetEntity?.status,
      comment: `実行可能時間 (${dependency.afterTime}) 未到達`,
    },
  ]);
}

function checkAllJobsSuccess(
  targetKanriNo: string,
  dependency: JobDependency,
  entities: Record<string, OperationItem>,
  operationIds?: string[],
): DependencyCheckResult {
  if (!dependency.requiresAllJobsSuccess) return res(true);

  // operationIds が指定されている場合は reduce で一元処理、無ければ Object.values でフィルタ
  const targetItems: OperationItem[] = operationIds?.length
    ? operationIds.reduce<OperationItem[]>((acc, id) => {
        const normId = normalize(id);
        if (normId !== targetKanriNo && entities[normId]) {
          acc.push(entities[normId]);
        }
        return acc;
      }, [])
    : Object.values(entities).filter(
        (item) => normalize(item.kanriNo) !== targetKanriNo,
      );

  const missingDependencies: MissingDependency[] = targetItems
    .filter((item) => item.status?.toLowerCase() !== "success")
    .map((item) => ({
      kanriNo: String(item.kanriNo),
      status: item.status,
      comment: item.comment ?? `管理No.${item.kanriNo} 未完了`,
    }));

  return res(missingDependencies.length === 0, missingDependencies);
}

function checkDependsOn(
  dependency: JobDependency,
  entities: Record<string, OperationItem>,
): DependencyCheckResult {
  const dependsOn = dependency.dependsOn.map(normalize);
  if (dependsOn.length === 0) return res(true);

  const missingDependencies: MissingDependency[] = [];
  let satisfiedCount = 0;

  for (const depKanriNo of dependsOn) {
    const entity = entities[depKanriNo];
    const currentStatus = entity?.status?.toLowerCase() ?? "";
    const requiredStatuses = getRequiredStatuses(dependency, depKanriNo);
    const isOk = requiredStatuses.includes(currentStatus);

    if (isOk) {
      satisfiedCount++;
    } else {
      missingDependencies.push({
        kanriNo: depKanriNo,
        status: entity?.status,
        comment: entity?.comment ?? "",
      });
    }
  }

  const isSatisfied =
    dependency.condition === "some"
      ? satisfiedCount > 0
      : missingDependencies.length === 0;

  return isSatisfied ? res(true) : res(false, missingDependencies);
}

// ============================================================================
// Public API
// ============================================================================

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: ActiveFlags,
  operationIds?: string[],
): DependencyCheckResult {
  const targetKanriNo = normalize(kanriNo);
  const targetEntity = entities[targetKanriNo];
  const dependency = targetEntity?.dependency;

  if (!dependency) return res(true);

  const activeRes = checkRequiredActiveFlags(dependency, activeFlags);
  if (!activeRes.ok) return activeRes;

  const timeRes = checkAfterTime(targetKanriNo, dependency, targetEntity);
  if (!timeRes.ok) return timeRes;

  const allJobsRes = checkAllJobsSuccess(
    targetKanriNo,
    dependency,
    entities,
    operationIds,
  );
  if (!allJobsRes.ok) return allJobsRes;

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
      .join("\n") || "未完了の依存ジョブがあります";

  return { ok: false, message };
}
