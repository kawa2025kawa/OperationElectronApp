// src/renderer/features/operation/services/internal/operationHelpers.ts
import { toast } from "sonner";
import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation";
import type { JobExecutionOptions } from "@shared/utils/dependencyHelper";
import {
  createErrorStatus,
  findEntityByKanriNo,
} from "@renderer/features/operation/helpers/operationEntities";

export const DEFAULT_JOB_EXECUTION_OPTIONS: JobExecutionOptions = {
  ignoreDependencies: true,
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
  const item = findEntityByKanriNo(state, kanriNo);
  if (!item) {
    throw new Error(`対象項目が見つかりません: ${kanriNo}`);
  }
  return item;
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
