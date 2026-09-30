// src/renderer/features/operation/services/jcJobService.ts

import { toast } from "sonner";

import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/asyncProcessor";
import { operationCommands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";

import { JOB_STATUS } from "@shared/types/operation/operationTypes";
import type { JobExecutionOptions } from "@shared/utils/dependency/dependencyUtils";

import {
  applyOperationError,
  getErrorMessage,
  requireMaster,
  resolveJobExecutionOptions,
} from "./internal/operationExecutionUtils";
import { validateExecution } from "./internal/operationValidators";

function resolveJobId(item: { jobId?: string }, kanriNo: string): string {
  if (item.jobId && item.jobId !== "-") {
    return String(item.jobId);
  }

  return kanriNo;
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

  const master = requireMaster(state, kanriNo);

  const jobId = resolveJobId("jobId" in master ? master : {}, kanriNo);

  await runJobWithGlobalProcessing(state, "JC 実行中...", jobId, async () => {
    const validation = validateExecution(state, kanriNo, resolvedOptions);

    if (!validation.ok) {
      await applyOperationError(kanriNo, validation.message);

      if (!resolvedOptions.silent) {
        toast.error(validation.message);
      }

      return;
    }

    try {
      const result = await operationCommands.fetchSingleJobStatus(kanriNo);

      if (!result) {
        throw new Error(`No.${kanriNo} のステータスを取得できませんでした`);
      }

      const status = result.status ?? JOB_STATUS.SCHEDULED;

      const comment =
        result.comment ??
        (status === JOB_STATUS.RUNNING ? "JC 実行中..." : "JC 状態更新");

      await operationCommands.updateJobStatus(kanriNo, status, comment);

      if (!resolvedOptions.silent) {
        toast.info(`No.${kanriNo} JC 状態を更新しました`);
      }
    } catch (error) {
      const message = getErrorMessage(error);

      const errorMessage = `JC 実行エラー: ${message}`;

      await applyOperationError(kanriNo, errorMessage);

      if (!resolvedOptions.silent) {
        toast.error(errorMessage);
      }

      throw error;
    }
  });
}
