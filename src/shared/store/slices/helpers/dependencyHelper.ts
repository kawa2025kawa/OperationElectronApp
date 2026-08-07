// src/shared/store/slices/helpers/dependencyHelper.ts

import type {
  JobDependenciesJson,
  JobDependency,
  OperationItem,
} from "@shared/types/operationType";

export function checkJobDependencies(
  kanriNo: string,
  entities: Record<string, OperationItem>,
  jobDependencies: JobDependenciesJson,
): boolean {
  if (!jobDependencies?.dependencies) {
    return true;
  }

  const rawRule = jobDependencies.dependencies[kanriNo];

  if (!rawRule) {
    return true;
  }

  const dependsOn: string[] = Array.isArray(rawRule)
    ? rawRule
    : ((rawRule as JobDependency).dependsOn ?? []);

  if (dependsOn.length === 0) {
    return true;
  }

  return !dependsOn.some((parentNo) => {
    const parent = entities[parentNo];

    return !parent || parent.status !== "success";
  });
}
