// src/renderer/features/operation/services/internal/operationExecutionUtils.ts

import {
  findMasterByKanriNo,
  type MasterRow,
} from "@renderer/features/operation/helpers/entityUtils";
import { operationCommands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";

import { JOB_STATUS } from "@shared/types/operation/operationTypes";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";

const DEFAULT_JOB_EXECUTION_OPTIONS: JobExecutionOptions = {
  ignoreDependencies: false,
  silent: true,
};

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function resolveJobExecutionOptions(
  options?: JobExecutionOptions,
): JobExecutionOptions {
  return {
    ...DEFAULT_JOB_EXECUTION_OPTIONS,
    ...options,
  };
}

export function requireMaster(state: AppState, kanriNo: string): MasterRow {
  const master = findMasterByKanriNo(state, kanriNo);

  if (!master) {
    throw new Error(`対象マスタが存在しません: ${kanriNo}`);
  }

  return master;
}

export async function applyOperationError(
  kanriNo: string,
  message: string,
): Promise<void> {
  await operationCommands.updateJobStatus(kanriNo, JOB_STATUS.ERROR, message);
}
