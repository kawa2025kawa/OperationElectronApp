// src/renderer/features/operation/services/operationServices.ts

import { toast } from "sonner";
import { commands } from "@shared/service/commands";
import type { AppState } from "@shared/store";
import { JOB_STATUS, type JobStatus, type OperationItem } from "@shared/types/operationType";
import {
  type JobExecutionOptions,
  validateJobDependencies,
} from "@renderer/features/operation/helpers/dependencyHelper";
import {
  calculateSummary,
  createErrorStatus,
  createRunningStatus,
  createSuccessStatus,
  findEntityByKanriNo,
  getAllEntitiesArray,
  getAllEntitiesMap,
  runJobWithGlobalProcessing,
} from "@renderer/features/operation/helpers/operationEntities";
import { calculateNextStatus } from "@renderer/features/operation/helpers/statusEvaluator";

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

  if (lowerLabel === "total") {
    return targetItems;
  }

  if (lowerLabel === "progress") {
    return targetItems.filter((item: OperationItem) => {
      const status = item.status ? String(item.status).toLowerCase() : "";
      return status === "running" || status === "scriptrunning";
    });
  }

  const activeFlags = {
    is1CActive: Boolean(state.is1CActive),
    is2CActive: Boolean(state.is2CActive),
    is3CActive: Boolean(state.is3CActive),
  };

  const allEntitiesMap = getAllEntitiesMap(state);

  return targetItems.filter((item: OperationItem) => {
    const currentStatus = (
      item.status ? String(item.status).toLowerCase() : ""
    ) as JobStatus;

    return (
      calculateNextStatus(item, currentStatus, allEntitiesMap, activeFlags) ===
      lowerLabel
    );
  });
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

  if (!item) {
    throw new Error(`対象ジョブが見つかりません: ${kanriNo}`);
  }

  const jobId = String(
    "jobId" in item && item.jobId ? item.jobId : kanriNo,
  ).trim();

  await runJobWithGlobalProcessing(state, "JC照会中...", jobId, async () => {
    // 1. 依存関係の共通検証
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

    // 2. JCステータス取得と反映
    try {
      const result = await commands.fetchSingleJobStatus(kanriNo);
      const status = result.status ?? JOB_STATUS.SCHEDULED;

      state.updateItemStatus({
        ...item,
        status,
        startTime: result.startTime ?? item.startTime,
        endTime: result.endTime ?? item.endTime,
        expectedStartTime: result.expectedStartTime ?? item.expectedStartTime,
        expectedEndTime: result.expectedEndTime ?? item.expectedEndTime,
        comment:
          result.comment ??
          (status === JOB_STATUS.RUNNING ? "JC実行中..." : "JC状態取得完了"),
        substatus: result.substatus ?? item.substatus,
        info: result.info ?? item.info,
      });

      if (!options.silent) {
        toast.info(`No.${kanriNo} JCステータス更新完了`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errText = `JC実行エラー: ${message}`;

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

  const targetName = String(item.workName ?? kanriNo).trim();
  let resultText = "";

  await runJobWithGlobalProcessing(
    state,
    "スクリプト実行中...",
    targetName,
    async () => {
      // 1. 依存関係の共通検証
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

      // 2. 実行中ステートへ更新
      state.updateItemStatus(
        createRunningStatus(kanriNo, item, "スクリプト実行中..."),
      );

      // 3. スクリプト実行と結果更新
      try {
        const resultMessage = await commands.executeScript(kanriNo, filePath);
        resultText = resultMessage || "スクリプト実行完了";

        state.updateItemStatus(createSuccessStatus(kanriNo, item, resultText));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const comment = `スクリプト実行エラー: ${message}`;

        state.updateItemStatus(createErrorStatus(kanriNo, item, comment));
        if (!options.silent) toast.error(comment);
        throw error;
      }
    },
  );

  return resultText;
}
