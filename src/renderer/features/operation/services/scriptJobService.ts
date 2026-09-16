// src/renderer/features/operation/services/scriptJobService.ts
import { toast } from "sonner";
import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import type { JobResult, OperationItem } from "@shared/types/operation";
import type { JobExecutionOptions } from "@shared/utils/dependencyHelper";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/operationEntities";
import {
  getErrorMessage,
  requireOperationItem,
  resolveJobExecutionOptions,
} from "./internal/operationHelpers";
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
      return await commands.executeScript(kanriNo, filePath);
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
  let item: OperationItem;
  try {
    item = requireOperationItem(state, kanriNo);
  } catch (error) {
    const message = getErrorMessage(error);
    if (!resolvedOptions.silent) {
      toast.error(message);
    }
    throw error;
  }

  const targetName = item.workName || kanriNo;
  return runJobWithGlobalProcessing(
    state,
    "スクリプト実行中...",
    targetName,
    async (): Promise<JobResult> => {
      const validation = validateExecution(state, kanriNo, resolvedOptions);
      if (!validation.ok) {
        state.updateItemStatus({
          ...item,
          comment: validation.message,
        });
        if (!resolvedOptions.silent) {
          toast.warning(validation.message);
        }
        throw new Error(validation.message);
      }

      try {
        return await commands.executeScript(kanriNo, filePath);
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
