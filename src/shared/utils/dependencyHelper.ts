// src/shared/utils/dependencyHelper.ts

import type {
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

  const raw = Array.isArray(req) ? req : req[kanriNo];
  return raw?.length
    ? raw.map((s) => String(s).toLowerCase())
    : [DEFAULT_REQUIRED_STATUS];
}

// ============================================================================
// Dependency Checks
// ============================================================================

function checkRequiredActiveFlags(
  dependency: JobDependency,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  if (!dependency.requiresActive?.length) return res(true);
  if (!activeFlags) return res(false);

  const isActive = dependency.requiresActive.every((key) =>
    Boolean(activeFlags[key]),
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
): DependencyCheckResult {
  if (!dependency.requiresAllJobsSuccess) return res(true);

  const missingDependencies = Object.values(entities)
    .filter((item) => normalize(item.kanriNo) !== targetKanriNo)
    // kind === "operation" に絞り込むことで、TypeScript に jobId の存在を認識させる
    .filter(
      (item): item is Extract<OperationItem, { kind: "operation" }> =>
        item.kind === "operation" && Boolean(item.jobId && item.jobId !== "-"),
    )
    .filter((item) => item.status?.toLowerCase() !== "success")
    .map((item) => ({
      kanriNo: String(item.kanriNo),
      status: item.status,
      comment: item.comment ?? `Job ID (${item.jobId}) 未完了`,
    }));

  return res(missingDependencies.length === 0, missingDependencies);
}

function checkDependsOn(
  dependency: JobDependency,
  entities: Record<string, OperationItem>,
): DependencyCheckResult {
  const dependsOn = dependency.dependsOn.map(normalize);
  if (dependsOn.length === 0) return res(true);

  const results = dependsOn.map((depKanriNo) => {
    const entity = entities[depKanriNo];
    const currentStatus = entity?.status?.toLowerCase() ?? "";
    const requiredStatuses = getRequiredStatuses(dependency, depKanriNo);

    return {
      ok: requiredStatuses.includes(currentStatus),
      missing: {
        kanriNo: depKanriNo,
        status: entity?.status,
        comment: entity?.comment ?? "",
      },
    };
  });

  const isSatisfied =
    dependency.condition === "some"
      ? results.some(({ ok }) => ok)
      : results.every(({ ok }) => ok);

  return isSatisfied
    ? res(true)
    : res(
        false,
        results.filter(({ ok }) => !ok).map(({ missing }) => missing),
      );
}

// ============================================================================
// Public API
// ============================================================================

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  const targetKanriNo = normalize(kanriNo);
  const targetEntity = entities[targetKanriNo];
  const dependency = targetEntity?.dependency;

  if (!dependency) return res(true);

  const activeRes = checkRequiredActiveFlags(dependency, activeFlags);
  if (!activeRes.ok) return activeRes;

  const timeRes = checkAfterTime(targetKanriNo, dependency, targetEntity);
  if (!timeRes.ok) return timeRes;

  const allJobsRes = checkAllJobsSuccess(targetKanriNo, dependency, entities);
  if (!allJobsRes.ok) return allJobsRes;

  return checkDependsOn(dependency, entities);
}

export function validateJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  options: JobExecutionOptions = DEFAULT_JOB_EXECUTION_OPTIONS,
  activeFlags?: Record<string, boolean>,
): ValidationResult {
  if (options.ignoreDependencies) return { ok: true };

  const result = checkJobDependencies(kanriNo, entities, activeFlags);
  if (result.ok) return { ok: true };

  const message =
    result.missingDependencies
      .map(({ kanriNo: depKanriNo, comment }) =>
        comment ? `No.${depKanriNo}: ${comment}` : `No.${depKanriNo}: 未完了`,
      )
      .join("\n") || "未完了の依存ジョブがあります";

  return { ok: false, message };
}
