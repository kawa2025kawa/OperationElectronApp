// src/shared/utils/dependencyHelper.ts

export {
  normalizeDependencies,
  checkDependsOn,
  checkJobDependencies,
  validateJobDependencies,
  DEFAULT_JOB_EXECUTION_OPTIONS,
  type MissingDependency,
  type DependencyCheckResult,
  type JobExecutionOptions,
  type ValidationResult,
} from "./dependency/dependencyUtils";

import type { OperationItem } from "@shared/types/operation/operationTypes";
import { normalizeDependencies } from "./dependency/dependencyUtils";

/**
 * 完了した kanriNo に関連する依存ターゲット一覧を取得
 */
export function getRelatedDependentItems(
  completedKanriNo: string | number,
  entities: Record<string, OperationItem>,
): OperationItem[] {
  const targetIdStr = String(completedKanriNo).trim();
  if (!targetIdStr) return [];

  return Object.values(entities).filter((item) => {
    const validDependsOn = normalizeDependencies(item?.dependency?.dependsOn);
    if (validDependsOn.length === 0) return false;
    return validDependsOn.includes(targetIdStr);
  });
}
