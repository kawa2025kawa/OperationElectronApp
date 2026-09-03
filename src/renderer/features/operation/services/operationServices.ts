// src/renderer/features/operation/services/operationServices.ts

import { toast } from "sonner";

import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";

import {
  JOB_STATUS,
  type JobResult,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operation";

import {
  type JobExecutionOptions,
  validateJobDependencies,
} from "@shared/utils/dependencyHelper";

import {
  calculateSummary,
  createErrorStatus,
  findEntityByKanriNo,
  getAllEntitiesArray,
  getAllEntitiesMap,
  runJobWithGlobalProcessing,
} from "@renderer/features/operation/helpers/operationEntities";

/* ============================================================================
 * Types
 * ========================================================================== */

export type ScriptFilePath = string | string[];

/* ============================================================================
 * Constants
 * ========================================================================== */

const DEFAULT_JOB_EXECUTION_OPTIONS: JobExecutionOptions = {
  ignoreDependencies: true,
  silent: true,
};

/* ============================================================================
 * Internal Types
 * ========================================================================== */

type ExecutionValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

/* ============================================================================
 * Internal Helpers
 * ========================================================================== */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function resolveJobExecutionOptions(
  options?: JobExecutionOptions,
): JobExecutionOptions {
  return {
    ...DEFAULT_JOB_EXECUTION_OPTIONS,
    ...options,
  };
}

function requireOperationItem(state: AppState, kanriNo: string): OperationItem {
  const item = findEntityByKanriNo(state, kanriNo);

  if (!item) {
    throw new Error(`対象ジョブが見つかりません: ${kanriNo}`);
  }

  return item;
}

function validateExecution(
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
    message: validation.message ?? "未完了の依存ジョブがあります。",
  };
}

/**
 * kind === "operation" で型をガードして jobId を安全に取得
 */
function resolveJobId(item: OperationItem, kanriNo: string): string {
  if (item.kind === "operation" && item.jobId) {
    return String(item.jobId);
  }

  return kanriNo;
}

function applyValidationError(
  state: AppState,
  kanriNo: string,
  item: OperationItem,
  message: string,
): void {
  state.updateItemStatus(createErrorStatus(kanriNo, item, message));
}

function mergeJobStatus(
  item: OperationItem,
  result: OperationItem,
): OperationItem {
  const status = result.status ?? JOB_STATUS.SCHEDULED;

  const comment =
    result.comment ??
    (status === JOB_STATUS.RUNNING ? "JC実行中..." : "JC状態取得完了");

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

async function applyExecutionError(
  state: AppState,
  kanriNo: string,
  item: OperationItem,
  status: JobStatus,
  message: string,
): Promise<void> {
  await commands.updateJobStatus(kanriNo, status, message);

  state.updateItemStatus(createErrorStatus(kanriNo, item, message));
}

/* ============================================================================
 * Summary Services
 * ========================================================================== */

export function refreshSummary(state: AppState): void {
  state.summary = calculateSummary(getAllEntitiesArray(state), {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  });
}

export function filterSummaryItems(
  state: AppState,
  label: string,
): OperationItem[] {
  const normalizedLabel = label.trim().toLowerCase();
  const items = getAllEntitiesArray(state);

  switch (normalizedLabel) {
    case "total":
      return items;

    case "progress":
      return items.filter((item) => {
        const status = item.status?.toLowerCase();

        return (
          status === JOB_STATUS.RUNNING.toLowerCase() ||
          status === JOB_STATUS.SCRIPT_RUNNING.toLowerCase()
        );
      });

    default:
      return items.filter(
        (item) => item.status?.toLowerCase() === normalizedLabel,
      );
  }
}

/* ============================================================================
 * JC Job Execution
 * ========================================================================== */

export async function executeJcJob(
  state: AppState,
  kanriNo: string,
  options?: JobExecutionOptions,
): Promise<void> {
  const resolvedOptions = resolveJobExecutionOptions(options);

  const item = requireOperationItem(state, kanriNo);
  const jobId = resolveJobId(item, kanriNo);

  await runJobWithGlobalProcessing(state, "JC処理中...", jobId, async () => {
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
        (status === JOB_STATUS.RUNNING ? "JC実行中..." : "JC状態取得完了");

      await commands.updateJobStatus(kanriNo, status, comment);

      state.updateItemStatus(mergeJobStatus(item, result));

      if (!resolvedOptions.silent) {
        toast.info(`No.${kanriNo} JCステータス更新完了`);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const errorMessage = `JC実行時エラー: ${message}`;

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

/* ============================================================================
 * Script Job Execution
 * ========================================================================== */

export async function executeScriptJob(
  state: AppState,
  kanriNo: string,
  filePath?: ScriptFilePath,
  options?: JobExecutionOptions,
): Promise<JobResult> {
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
          toast.error(`スクリプト実行時エラー: ${message}`);
        }

        throw error;
      }
    },
  );
}
