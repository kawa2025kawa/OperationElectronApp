// src/shared/utils/dependencyHelper.ts

import type {
  JobDependency,
  JobStatus,
  OperationItem,
} from "@shared/types/operation";

// ============================================================================
// Types
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

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_JOB_EXECUTION_OPTIONS: Readonly<JobExecutionOptions> = {
  ignoreDependencies: true,
  silent: true,
};

const DEFAULT_REQUIRED_STATUS: JobStatus = "success";

// ============================================================================
// Result Helpers
// ============================================================================

function success(): DependencyCheckResult {
  return {
    ok: true,
    missingDependencies: [],
  };
}

function failure(
  missingDependencies: MissingDependency[] = [],
): DependencyCheckResult {
  return {
    ok: false,
    missingDependencies,
  };
}

// ============================================================================
// Dependency Helpers
// ============================================================================

function normalizeKanriNo(kanriNo: string | number): string {
  return String(kanriNo).trim();
}

function getDependsOn(dependency: JobDependency): string[] {
  return dependency.dependsOn.map(normalizeKanriNo);
}

function normalizeStatuses(statuses: JobStatus[] | undefined): string[] {
  if (!statuses?.length) {
    return [DEFAULT_REQUIRED_STATUS];
  }

  return statuses.map((status) => String(status).toLowerCase());
}

function getRequiredStatuses(
  dependency: JobDependency,
  kanriNo: string,
): string[] {
  const requiredStatus = dependency.requiredStatus;

  if (!requiredStatus) {
    return [DEFAULT_REQUIRED_STATUS];
  }

  if (Array.isArray(requiredStatus)) {
    return normalizeStatuses(requiredStatus);
  }

  return normalizeStatuses(requiredStatus[kanriNo]);
}

// ============================================================================
// Active Flag
// ============================================================================

function checkRequiredActiveFlags(
  dependency: JobDependency,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  if (!dependency.requiresActive?.length) {
    return success();
  }

  if (!activeFlags) {
    return failure();
  }

  const isActive = dependency.requiresActive.every((flagKey) =>
    Boolean(activeFlags[flagKey]),
  );

  return isActive ? success() : failure();
}

// ============================================================================
// Time Condition
// ============================================================================

function checkAfterTime(
  kanriNo: string,
  dependency: JobDependency,
  targetEntity: OperationItem | undefined,
): DependencyCheckResult {
  if (!dependency.afterTime) {
    return success();
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(dependency.afterTime);

  if (!match) {
    return failure([
      {
        kanriNo,
        status: targetEntity?.status,
        comment: `実行可能時間の設定が不正です: ${dependency.afterTime}`,
      },
    ]);
  }

  const targetHour = Number(match[1]);
  const targetMinute = Number(match[2]);

  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const targetMinutes = targetHour * 60 + targetMinute;

  if (currentMinutes >= targetMinutes) {
    return success();
  }

  return failure([
    {
      kanriNo,
      status: targetEntity?.status,
      comment: `実行可能時間 (${dependency.afterTime}) 未到達`,
    },
  ]);
}

// ============================================================================
// All Jobs Success
// ============================================================================

function checkAllJobsSuccess(
  targetKanriNo: string, // ➔ 引数に対象の kanriNo を追加
  dependency: JobDependency,
  entities: Record<string, OperationItem>,
): DependencyCheckResult {
  if (!dependency.requiresAllJobsSuccess) {
    return success();
  }

  const missingDependencies: MissingDependency[] = [];

  for (const item of Object.values(entities)) {
    // 自身は除外
    if (normalizeKanriNo(item.kanriNo) === targetKanriNo) {
      continue;
    }

    if (!hasValidJobId(item)) {
      continue;
    }

    const status = item.status?.toLowerCase();

    if (status === "success") {
      continue;
    }

    missingDependencies.push({
      kanriNo: String(item.kanriNo),
      status: item.status,
      comment: item.comment ?? `Job ID (${getJobId(item)}) 未完了`,
    });
  }

  return missingDependencies.length === 0
    ? success()
    : failure(missingDependencies);
}

// ============================================================================
// dependsOn
// ============================================================================

function hasValidJobId(item: OperationItem): boolean {
  if (item.kind !== "operation") {
    return false;
  }
  return Boolean(item.jobId && item.jobId !== "-");
}

function getJobId(item: OperationItem): string {
  if (item.kind !== "operation") {
    return "";
  }
  return item.jobId ? String(item.jobId) : "";
}

function checkDependsOn(
  kanriNo: string,
  dependency: JobDependency,
  entities: Record<string, OperationItem>,
): DependencyCheckResult {
  const dependsOn = getDependsOn(dependency);

  if (dependsOn.length === 0) {
    return success();
  }

  const results = dependsOn.map((dependencyKanriNo) => {
    const entity = entities[dependencyKanriNo];

    const currentStatus = entity?.status?.toLowerCase() ?? "";

    const requiredStatuses = getRequiredStatuses(dependency, dependencyKanriNo);

    const ok = requiredStatuses.includes(currentStatus);

    return {
      ok,
      missing: {
        kanriNo: dependencyKanriNo,
        status: entity?.status,
        comment: entity?.comment ?? "",
      },
    };
  });

  const isSatisfied =
    dependency.condition === "some"
      ? results.some(({ ok }) => ok)
      : results.every(({ ok }) => ok);

  if (isSatisfied) {
    return success();
  }

  return failure(results.filter(({ ok }) => !ok).map(({ missing }) => missing));
}

// ============================================================================
// Public API
// ============================================================================

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  const targetKanriNo = normalizeKanriNo(kanriNo);
  const targetEntity = entities[targetKanriNo];
  const dependency = targetEntity?.dependency;

  if (!dependency) {
    return success();
  }

  const activeResult = checkRequiredActiveFlags(dependency, activeFlags);
  if (!activeResult.ok) return activeResult;

  const timeResult = checkAfterTime(targetKanriNo, dependency, targetEntity);
  if (!timeResult.ok) return timeResult;

  // ➔ targetKanriNo を渡す
  const allJobsResult = checkAllJobsSuccess(
    targetKanriNo,
    dependency,
    entities,
  );
  if (!allJobsResult.ok) return allJobsResult;

  return checkDependsOn(targetKanriNo, dependency, entities);
}
export function validateJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  options: JobExecutionOptions = DEFAULT_JOB_EXECUTION_OPTIONS,
  activeFlags?: Record<string, boolean>,
): ValidationResult {
  if (options.ignoreDependencies) {
    return {
      ok: true,
    };
  }

  const result = checkJobDependencies(kanriNo, entities, activeFlags);

  if (result.ok) {
    return {
      ok: true,
    };
  }

  return {
    ok: false,
    message:
      result.missingDependencies
        .map(({ kanriNo: dependencyKanriNo, comment }) =>
          comment
            ? `No.${dependencyKanriNo}: ${comment}`
            : `No.${dependencyKanriNo}: 未完了`,
        )
        .join("\n") || "未完了の依存ジョブがあります",
  };
}
