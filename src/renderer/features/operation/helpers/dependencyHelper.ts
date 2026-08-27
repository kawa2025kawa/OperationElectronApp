// src/renderer/features/operation/helpers/dependencyHelper.ts

import type {
  JobDependency,
  JobStatus,
  OperationItem,
} from "@shared/types/operationType";
import { hasValidJobId } from "./operationSummary";

// ============================================================
// Types
// ============================================================

interface MissingDependency {
  kanriNo: string;
  status: JobStatus | null | undefined;
  comment: string;
}

export interface DependencyCheckResult {
  ok: boolean;
  missingDependencies: MissingDependency[];
}

export interface JobExecutionOptions {
  /** 手動実行時など、依存関係チェックを無視する場合は true (デフォルト: true) */
  ignoreDependencies?: boolean;

  /** 手動操作時など、toast通知を出さない場合は true (デフォルト: true) */
  silent?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  message?: string;
}

type RequiredStatus = JobStatus[] | Record<string, JobStatus[]> | undefined;

// ============================================================
// Helper Functions
// ============================================================

const success = (): DependencyCheckResult => ({
  ok: true,
  missingDependencies: [],
});

const getDependsOn = (rule: string[] | JobDependency): string[] =>
  Array.isArray(rule) ? rule.map(String) : (rule.dependsOn ?? []).map(String);

const getRequiredStatus = (
  requiredStatus: RequiredStatus,
  kanriNo: string,
): string[] => {
  if (!requiredStatus) return ["success"];
  if (Array.isArray(requiredStatus)) return requiredStatus.map(String);
  const targetKey = String(kanriNo).trim();
  const matchedKey = Object.keys(requiredStatus).find(
    (k) => String(k).trim() === targetKey,
  );
  return matchedKey ? requiredStatus[matchedKey].map(String) : ["success"];
};

// ============================================================
// Core Functions
// ============================================================

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  const targetKey = String(kanriNo).trim();
  const targetEntity =
    entities[targetKey] ??
    Object.values(entities).find(
      (item) => String(item.kanriNo).trim() === targetKey,
    );
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
    const jobIdEntities = Object.values(entities).filter(hasValidJobId);
    const uncompleted = jobIdEntities.filter(
      (item) => String(item.status).toLowerCase() !== "success",
    );
    if (uncompleted.length > 0) {
      return {
        ok: false,
        missingDependencies: uncompleted.map((item) => {
          const jobIdStr = "jobId" in item && item.jobId ? item.jobId : "";
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
    const depEntity =
      entities[depKey] ??
      Object.values(entities).find(
        (item) => String(item.kanriNo).trim() === depKey,
      );
    const required = getRequiredStatus(rule.requiredStatus, depKanriNo);
    const currentStatus = depEntity?.status
      ? String(depEntity.status).toLowerCase()
      : "";
    const isMet = Boolean(
      currentStatus &&
      required.some((req) => req.toLowerCase() === currentStatus),
    );

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

function getMissingDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): MissingDependency[] {
  return checkJobDependencies(kanriNo, entities, activeFlags)
    .missingDependencies;
}

export function getDependentKanriNos(
  kanriNo: string,
  entities: Record<string, OperationItem>,
): string[] {
  const target = String(kanriNo).trim();
  return Object.values(entities)
    .filter((entity) => {
      if (!entity.dependency) return false;
      return getDependsOn(entity.dependency).some(
        (dep) => String(dep).trim() === target,
      );
    })
    .map((entity) => String(entity.kanriNo));
}

// ============================================================
// Guard Function
// ============================================================

const DEFAULT_OPTIONS: JobExecutionOptions = {
  ignoreDependencies: true,
  silent: true,
};

export function validateJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  options: JobExecutionOptions = DEFAULT_OPTIONS,
  activeFlags?: Record<string, boolean>,
): ValidationResult {
  const effectiveOptions = { ...DEFAULT_OPTIONS, ...options };

  if (effectiveOptions.ignoreDependencies) {
    return { ok: true };
  }

  const result = checkJobDependencies(kanriNo, entities, activeFlags);

  if (!result.ok) {
    return {
      ok: false,
      message: "未完了の依存ジョブがあります",
    };
  }

  return { ok: true };
}
