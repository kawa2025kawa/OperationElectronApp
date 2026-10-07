import { toast } from "sonner";

import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { operationCommands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import type { JobResult } from "@shared/types/operation/operationTypes";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";

import {
  getErrorMessage,
  requireMaster,
  resolveJobExecutionOptions,
} from "./internal/operationExecutionUtils";
import { validateExecution } from "./internal/operationValidators";

export type ScriptFilePath = string | string[];

export async function executeScriptJob(
  state: AppState,
  kanriNo: string,
  scriptKey: string,
  filePath?: ScriptFilePath,
  options?: JobExecutionOptions,
): Promise<JobResult> {
  const cleanKanriNo = kanriNo.trim();
  const cleanScriptKey = scriptKey.trim();
  const resolvedOptions = resolveJobExecutionOptions(options);

  let master: {
    workName?: string;
  };

  try {
    master = requireMaster(state, cleanKanriNo);
  } catch (error) {
    const message = getErrorMessage(error);

    if (!resolvedOptions.silent) {
      toast.error(message);
    }

    throw error;
  }

  const targetName = master.workName || cleanKanriNo;

  return runJobWithGlobalProcessing(
    state,
    "スクリプト実行中...",
    targetName,
    async (): Promise<JobResult> => {
      const validation = validateExecution(
        state,
        cleanKanriNo,
        resolvedOptions,
      );

      if (!validation.ok) {
        if (!resolvedOptions.silent) {
          toast.warning(validation.message);
        }

        throw new Error(validation.message);
      }

      try {
        return await operationCommands.executeScript(
          cleanKanriNo,
          cleanScriptKey,
          filePath,
        );
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
