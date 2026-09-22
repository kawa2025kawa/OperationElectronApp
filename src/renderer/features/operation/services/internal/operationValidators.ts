import type { AppState } from "@renderer/store";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";
import { validateJobDependencies } from "@shared/utils/dependency/dependencyUtils";
import { getAllEntitiesMap } from "@renderer/features/operation/helpers/operationEntities";

export type ExecutionValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateExecution(
  state: AppState,
  kanriNo: string,
  options: JobExecutionOptions,
): ExecutionValidationResult {
  const validation = validateJobDependencies(
    kanriNo,
    getAllEntitiesMap(state),
    options,
  );
  if (validation.ok) {
    return { ok: true };
  }
  return {
    ok: false,
    message: validation.message ?? "依存関係エラーが発生しました",
  };
}
