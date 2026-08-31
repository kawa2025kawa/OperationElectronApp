// src/renderer/features/operation/services/operationServices.ts

import { toast } from "sonner";
import { commands } from "@renderer/services/commands";
import type { AppState } from "@renderer/store";
import {
  JOB_STATUS,
  type JobStatus,
  type OperationItem,
} from "@shared/types/operationType";
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

// ============================================================
// Summary Services
// ============================================================

export function refreshSummary(state: AppState): void {
  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };

  state.summary = calculateSummary(getAllEntitiesArray(state), activeFlags);
}

export function filterSummaryItems(
  state: AppState,
  label: string,
): OperationItem[] {
  const lowerLabel = label.toLowerCase();
  const targetItems = getAllEntitiesArray(state);

  if (lowerLabel === "total") return targetItems;

  if (lowerLabel === "progress") {
    return targetItems.filter((item) => {
      const status = item.status?.toLowerCase();
      return status === "running" || status === "scriptrunning";
    });
  }

  return targetItems.filter(
    (item) => (item.status?.toLowerCase() ?? "") === lowerLabel,
  );
}

// ============================================================
// Job Execution Services (JC & Script)
// ============================================================

export async function executeJcJob(
  state: AppState,
  kanriNo: string,
  options: JobExecutionOptions = { ignoreDependencies: true, silent: true },
): Promise<void> {
  const item = findEntityByKanriNo(state, kanriNo);
  if (!item) throw new Error(`対象ジョブが見つかりません: ${kanriNo}`);

  const jobId = "jobId" in item && item.jobId ? String(item.jobId) : kanriNo;

  await runJobWithGlobalProcessing(state, "JC照会中...", jobId, async () => {
    const validation = validateJobDependencies(
      kanriNo,
      getAllEntitiesMap(state),
      options,
    );

    if (!validation.ok) {
      const message = validation.message ?? "前提条件が満たされていません";
      state.updateItemStatus(createErrorStatus(kanriNo, item, message));
      if (!options.silent) toast.error(message);
      return;
    }

    try {
      const result = await commands.fetchSingleJobStatus(kanriNo);
      const status = result.status ?? JOB_STATUS.SCHEDULED;
      const comment =
        result.comment ??
        (status === JOB_STATUS.RUNNING ? "JC実行中..." : "JC状態取得完了");

      // Mainプロセス (SSoT) 側のステータスも同期更新
      await commands.updateJobStatus(kanriNo, status, comment);

      state.updateItemStatus({
        ...item,
        status,
        startTime: result.startTime ?? item.startTime,
        endTime: result.endTime ?? item.endTime,
        expectedStartTime: result.expectedStartTime ?? item.expectedStartTime,
        expectedEndTime: result.expectedEndTime ?? item.expectedEndTime,
        comment,
        substatus: result.substatus ?? item.substatus,
        info: result.info ?? item.info,
      });

      if (!options.silent) {
        toast.info(`No.${kanriNo} JCステータス更新完了`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errText = `JC実行エラー: ${message}`;

      await commands.updateJobStatus(kanriNo, JOB_STATUS.ERROR, errText);
      state.updateItemStatus(createErrorStatus(kanriNo, item, errText));
      if (!options.silent) toast.error(errText);
      throw error;
    }
  });
}

export async function executeScriptJob(
  state: AppState,
  kanriNo: string,
  filePath?: string | string[],
  options: JobExecutionOptions = { ignoreDependencies: true, silent: true },
): Promise<string> {
  const item = findEntityByKanriNo(state, kanriNo);
  if (!item) {
    const message = `対象ジョブが見つかりません: ${kanriNo}`;
    if (!options.silent) toast.error(message);
    throw new Error(message);
  }

  const targetName = item.workName || kanriNo;
  let resultText = "";

  await runJobWithGlobalProcessing(
    state,
    "スクリプト実行中...",
    targetName,
    async () => {
      const validation = validateJobDependencies(
        kanriNo,
        getAllEntitiesMap(state),
        options,
      );

      if (!validation.ok) {
        const comment = validation.message ?? "未完了の依存ジョブがあります";
        state.updateItemStatus({ ...item, comment });
        if (!options.silent) toast.warning(comment);
        throw new Error(comment);
      }

      try {
        resultText = await commands.executeScript(kanriNo, filePath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!options.silent) toast.error(`スクリプト実行エラー: ${message}`);
        throw error;
      }
    },
  );

  return resultText;
}
