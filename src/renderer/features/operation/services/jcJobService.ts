// src/renderer/features/operation/services/jcJobService.ts

import { toast } from "sonner";
import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import {
  JOB_STATUS,
  type OperationItem,
} from "@shared/types/operation/operationTypes";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/operationEntities";
import {
  applyExecutionError,
  applyValidationError,
  getErrorMessage,
  requireOperationItem,
  resolveJobExecutionOptions,
} from "./internal/operationHelpers";
import { validateExecution } from "./internal/operationValidators";

function resolveJobId(item: OperationItem, kanriNo: string): string {
  if ("jobId" in item && item.jobId) {
    return String(item.jobId);
  }
  return kanriNo;
}

function mergeJobStatus(
  item: OperationItem,
  result: OperationItem,
): OperationItem {
  const status = result.status ?? JOB_STATUS.SCHEDULED;
  const comment =
    result.comment ??
    (status === JOB_STATUS.RUNNING ? "JC実行中..." : "JC実行完了");

  return {
    ...item,
    status,
    startTime: result.startTime ?? item.startTime,
    endTime: result.endTime ?? item.endTime,
    expectedStartTime: result.expectedStartTime ?? item.expectedStartTime,
    expectedEndTime: result.expectedEndTime ?? item.expectedEndTime,
    comment,
    substatus: result.substatus ?? item.substatus,
    info: result.info ?? item.info,
  };
}

export async function executeJcJob(
  state: AppState,
  kanriNo: string,
  options?: JobExecutionOptions,
): Promise<void> {
  const resolvedOptions = resolveJobExecutionOptions({
    ignoreDependencies: true,
    ...options,
  });

  const item = requireOperationItem(state, kanriNo);
  const jobId = resolveJobId(item, kanriNo);

  await runJobWithGlobalProcessing(state, "JC実行中...", jobId, async () => {
    const validation = validateExecution(state, kanriNo, resolvedOptions);
    if (!validation.ok) {
      applyValidationError(state, kanriNo, item, validation.message);
      if (!resolvedOptions.silent) {
        toast.error(validation.message);
      }
      return;
    }

    try {
      const result = await commands.fetchSingleJobStatus(kanriNo);
      const status = result.status ?? JOB_STATUS.SCHEDULED;
      const comment =
        result.comment ??
        (status === JOB_STATUS.RUNNING ? "JC実行中..." : "JC実行完了");

      await commands.updateJobStatus(kanriNo, status, comment);
      state.updateItemStatus(mergeJobStatus(item, result));

      if (!resolvedOptions.silent) {
        toast.info(`No.${kanriNo} JC実行状態を確認しました`);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const errorMessage = `JC起動失敗: ${message}`;

      await applyExecutionError(
        state,
        kanriNo,
        item,
        JOB_STATUS.ERROR,
        errorMessage,
      );

      if (!resolvedOptions.silent) {
        toast.error(errorMessage);
      }
      throw error;
    }
  });
}
