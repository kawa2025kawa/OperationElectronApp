// src/renderer/features/operation/helpers/dependencyHelper.ts
import type {
  JobDependency,
  JobStatus,
  OperationItem,
} from "@shared/types/operationType";
import { hasValidJobId } from "./operationSummary";

export interface MissingDependency {
  kanriNo: string;
  status: JobStatus | null | undefined;
  comment: string;
}

export interface DependencyCheckResult {
  ok: boolean;
  missingDependencies: MissingDependency[];
}

type RequiredStatus = JobStatus[] | Record<string, JobStatus[]> | undefined;

/**
 * 対象ジョブの依存関係（requiresActive, requiresAllJobsSuccess, dependsOn）を評価
 */
export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): DependencyCheckResult {
  const targetKey = String(kanriNo).trim();
  const entityKey = Object.keys(entities).find(
    (k) => String(k).trim() === targetKey,
  );
  const targetEntity = entityKey ? entities[entityKey] : undefined;
  const rule = targetEntity?.dependency;
  if (!rule) return success();

  // 1. requiresActive チェック (is1CActive 等のフラグチェック)
  if (rule.requiresActive && rule.requiresActive.length > 0) {
    if (!activeFlags) {
      return { ok: false, missingDependencies: [] };
    }
    const activeMet = rule.requiresActive.every((flagKey) =>
      Boolean(activeFlags[flagKey]),
    );
    if (!activeMet) {
      return { ok: false, missingDependencies: [] };
    }
  }

  // 2. requiresAllJobsSuccess チェック (KanriNo 81 等、全 jobId の完了が必須なルール)
  if (rule.requiresAllJobsSuccess) {
    const jobIdEntities = Object.values(entities).filter(hasValidJobId);
    const uncompleted = jobIdEntities.filter(
      (item) => String(item.status).toLowerCase() !== "success",
    );

    if (uncompleted.length > 0) {
      return {
        ok: false,
        missingDependencies: uncompleted.map((item) => {
          // 型ガードで jobId を安全に取得
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

  // 3. dependsOn チェック (個別の依存ジョブチェック)
  const dependsOn = getDependsOn(rule);
  if (!dependsOn.length) {
    return success();
  }

  const results = dependsOn.map((depKanriNo) => {
    const depKey = Object.keys(entities).find(
      (k) => String(k).trim() === String(depKanriNo).trim(),
    );
    const depEntity = depKey ? entities[depKey] : undefined;
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

/**
 * 不足している依存関係のリストを取得
 */
export function getMissingDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  activeFlags?: Record<string, boolean>,
): MissingDependency[] {
  return checkJobDependencies(kanriNo, entities, activeFlags)
    .missingDependencies;
}

/**
 * 指定された kanriNo に依存している後続ジョブの kanriNo 一覧を取得
 */
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

// 内部ヘルパー関数
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

const success = (): DependencyCheckResult => ({
  ok: true,
  missingDependencies: [],
});
