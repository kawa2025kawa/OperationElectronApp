// src/shared/utils/dependencyHelper.ts

import type {
  JobDependency,
  JobStatus,
  OperationItem,
} from "@shared/types/operationType";

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

const success = (): DependencyCheckResult => ({
  ok: true,
  missingDependencies: [],
});

const getDependsOn = (rule: string[] | JobDependency): string[] =>
  Array.isArray(rule) ? rule.map(String) : (rule.dependsOn ?? []).map(String);

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  const targetKey = String(kanriNo).trim();
  const targetEntity = entities[targetKey];
  const rule = targetEntity?.dependency;
  if (!rule) return success();

  // 1. requiresActive 条件の評価
  if (rule.requiresActive && rule.requiresActive.length > 0) {
    if (!activeFlags) return { ok: false, missingDependencies: [] };
    const activeMet = rule.requiresActive.every((flagKey) =>
      Boolean(activeFlags[flagKey]),
    );
    if (!activeMet) return { ok: false, missingDependencies: [] };
  }

  // 2. requiresAllJobsSuccess 条件の評価
  if (rule.requiresAllJobsSuccess) {
    const uncompleted = Object.values(entities).filter((item) => {
      const rawJobId = "jobId" in item ? item.jobId : undefined;
      const hasJobId = Boolean(rawJobId && rawJobId !== "-");
      return hasJobId && String(item.status).toLowerCase() !== "success";
    });

    if (uncompleted.length > 0) {
      return {
        ok: false,
        missingDependencies: uncompleted.map((item) => {
          const jobIdStr =
            "jobId" in item && item.jobId ? String(item.jobId) : "";
          return {
            kanriNo: String(item.kanriNo),
            status: item.status,
            comment: item.comment ?? `Job ID (${jobIdStr}) 未完了`,
          };
        }),
      };
    }
  }

  // 3. dependsOn 依存関係の評価
  const dependsOn = getDependsOn(rule);
  if (!dependsOn.length) return success();

  const results = dependsOn.map((depKanriNo) => {
    const depKey = String(depKanriNo).trim();
    const depEntity = entities[depKey];
    const currentStatus = depEntity?.status
      ? String(depEntity.status).toLowerCase()
      : "";
    const isMet = currentStatus === "success";

    return {
      ok: isMet,
      missing: {
        kanriNo: depKanriNo,
        status: depEntity?.status,
        comment: depEntity?.comment ?? "",
      },
    };
  });

  const ok =
    rule.condition === "some"
      ? results.some((r) => r.ok)
      : results.every((r) => r.ok);

  return ok
    ? success()
    : {
        ok: false,
        missingDependencies: results.filter((r) => !r.ok).map((r) => r.missing),
      };
}

export function validateJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  options: JobExecutionOptions = { ignoreDependencies: true, silent: true },
  activeFlags?: Record<string, boolean>,
): ValidationResult {
  if (options.ignoreDependencies) return { ok: true };

  const result = checkJobDependencies(kanriNo, entities, activeFlags);
  return result.ok
    ? { ok: true }
    : { ok: false, message: "未完了の依存ジョブがあります" };
}
