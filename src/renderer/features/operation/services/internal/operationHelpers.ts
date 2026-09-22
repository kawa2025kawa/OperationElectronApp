import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import type {
  JobStatus,
  OperationItem,
} from "@shared/types/operation/operationTypes";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";
import {
  createErrorStatus,
  findEntityByKanriNo,
} from "@renderer/features/operation/helpers/operationEntities";

export const DEFAULT_JOB_EXECUTION_OPTIONS: JobExecutionOptions = {
  ignoreDependencies: false,
  silent: true,
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function resolveJobExecutionOptions(
  options?: JobExecutionOptions,
): JobExecutionOptions {
  return {
    ...DEFAULT_JOB_EXECUTION_OPTIONS,
    ...options,
  };
}

export function requireOperationItem(
  state: AppState,
  kanriNo: string,
): OperationItem {
  const key = String(kanriNo).trim();

  const operation = state.operationEntities[key];

  if (operation) {
    return operation;
  }

  const isTodayIrregular = state.todayIds.some(
    (id) => String(id).trim() === key,
  );

  if (isTodayIrregular) {
    const todayIrregular = state.irregularEntities[key];

    if (todayIrregular) {
      return todayIrregular;
    }
  }

  throw new Error(`Status管理対象の管理Noが見つかりません: ${kanriNo}`);
}

export function applyValidationError(
  state: AppState,
  kanriNo: string,
  item: OperationItem,
  message: string,
): void {
  state.updateItemStatus(createErrorStatus(kanriNo, item, message));
}

export async function applyExecutionError(
  state: AppState,
  kanriNo: string,
  item: OperationItem,
  status: JobStatus,
  message: string,
): Promise<void> {
  await commands.updateJobStatus(kanriNo, status, message);
  state.updateItemStatus(createErrorStatus(kanriNo, item, message));
}
