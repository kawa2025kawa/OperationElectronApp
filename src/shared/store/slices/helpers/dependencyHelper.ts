// src/shared/store/slices/helpers/dependencyHelper.ts

import type {
  JobDependenciesJson,
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

type RequiredStatus = string[] | Record<string, string[]> | undefined;

/**
 * 指定JOBの依存関係をチェックする。
 *
 * requiredStatus が未指定の場合は success を要求する。
 *
 * condition:
 *   every = 全依存先が条件を満たす
 *   some  = いずれか1つが条件を満たす
 */
export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  jobDependencies: JobDependenciesJson | null | undefined,
): DependencyCheckResult {
  const rule = jobDependencies?.dependencies?.[kanriNo];

  if (!rule) {
    return createSuccessResult();
  }

  const dependencyKanriNos = getDependencyKanriNos(rule);

  if (dependencyKanriNos.length === 0) {
    return createSuccessResult();
  }

  const condition = rule.condition ?? "every";

  const results = dependencyKanriNos.map((dependencyKanriNo) =>
    checkDependency(
      dependencyKanriNo,
      entities,
      getRequiredStatuses(rule.requiredStatus, dependencyKanriNo),
    ),
  );

  const ok =
    condition === "some"
      ? results.some((result) => result.ok)
      : results.every((result) => result.ok);

  if (ok) {
    return createSuccessResult();
  }

  return {
    ok: false,
    missingDependencies: results
      .filter((result) => !result.ok)
      .map((result) => result.missing),
  };
}

/**
 * 「このJOBを待たせている依存先」を取得する。
 */
export function getMissingDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  jobDependencies: JobDependenciesJson | null | undefined,
): MissingDependency[] {
  return checkJobDependencies(kanriNo, entities, jobDependencies)
    .missingDependencies;
}

/**
 * 指定したJOBに依存しているJOB一覧を取得する。
 *
 * 例:
 *
 * 57 → N21
 *
 * なら
 *
 * getDependentKanriNos("57")
 * => ["N21"]
 */
export function getDependentKanriNos(
  kanriNo: string,
  jobDependencies: JobDependenciesJson | null | undefined,
): string[] {
  if (!jobDependencies?.dependencies) {
    return [];
  }

  return Object.entries(jobDependencies.dependencies)
    .filter(([, rule]) => getDependencyKanriNos(rule).includes(kanriNo))
    .map(([dependentKanriNo]) => dependentKanriNo);
}

function checkDependency(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  requiredStatuses: string[],
): {
  ok: boolean;
  missing: MissingDependency;
} {
  const entity = entities[kanriNo];
  const status = entity?.status;

  const ok =
    entity != null &&
    requiredStatuses.some((requiredStatus) => status === requiredStatus);

  return {
    ok,
    missing: {
      kanriNo,
      status,
      comment: entity?.comment ?? "",
    },
  };
}

function getDependencyKanriNos(rule: string[] | JobDependency): string[] {
  if (Array.isArray(rule)) {
    return rule.map(String);
  }

  return (rule.dependsOn ?? []).map(String);
}

function getRequiredStatuses(
  requiredStatus: RequiredStatus,
  dependencyKanriNo: string,
): string[] {
  if (!requiredStatus) {
    return ["success"];
  }

  if (Array.isArray(requiredStatus)) {
    return requiredStatus;
  }

  return requiredStatus[dependencyKanriNo] ?? ["success"];
}

function createSuccessResult(): DependencyCheckResult {
  return {
    ok: true,
    missingDependencies: [],
  };
}
