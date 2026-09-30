// src/renderer/features/operation/services/scriptJobService.ts

import { toast } from "sonner";

import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { operationCommands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import type { JobResult } from "@shared/types/operation/operationTypes";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";

import {
  applyOperationError,
  getErrorMessage,
  requireMaster,
  resolveJobExecutionOptions,
} from "./internal/operationExecutionUtils";
import { validateExecution } from "./internal/operationValidators";

export type ScriptFilePath = string | string[];

export async function executeScriptJob(
  state: AppState,
  kanriNo: string,
  filePath?: ScriptFilePath,
  options?: JobExecutionOptions,
): Promise<JobResult> {
  const isReadOnlyCheck = kanriNo.toUpperCase().endsWith("_CHECK");

  if (isReadOnlyCheck) {
    try {
      return await operationCommands.executeScript(kanriNo, filePath);
    } catch (error) {
      const message = getErrorMessage(error);

      const resolvedOptions = resolveJobExecutionOptions(options);

      if (!resolvedOptions.silent) {
        toast.error(`スクリプト実行エラー: ${message}`);
      }

      throw error;
    }
  }

  const resolvedOptions = resolveJobExecutionOptions(options);

  let master: {
    workName?: string;
  };

  try {
    master = requireMaster(state, kanriNo);
  } catch (error) {
    const message = getErrorMessage(error);

    if (!resolvedOptions.silent) {
      toast.error(message);
    }

    throw error;
  }

  const targetName = master.workName || kanriNo;

  return runJobWithGlobalProcessing(
    state,
    "スクリプト実行中...",
    targetName,
    async (): Promise<JobResult> => {
      const validation = validateExecution(state, kanriNo, resolvedOptions);

      if (!validation.ok) {
        await applyOperationError(kanriNo, validation.message);

        if (!resolvedOptions.silent) {
          toast.warning(validation.message);
        }

        throw new Error(validation.message);
      }

      try {
        return await operationCommands.executeScript(kanriNo, filePath);
      } catch (error) {
        const message = getErrorMessage(error);

        if (!resolvedOptions.silent) {
          toast.error(`スクリプト実行エラー: ${message}`);
        }

        throw error;
      }
    },
  );
}
