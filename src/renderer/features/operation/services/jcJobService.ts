// src/renderer/features/operation/services/jcJobService.ts

import { toast } from "sonner";
import { commands } from "@shared/service/commands";
import type { AppState } from "@shared/store";
import { JOB_STATUS } from "@shared/types/operationType";
import {
  type JobExecutionOptions,
  validateJobDependencies,
} from "@renderer/features/operation/helpers/dependencyHelper";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/jobRunnerHelper";
import {
  findEntityByKanriNo,
  getAllEntities as getAllEntitiesMap,
} from "@renderer/features/operation/helpers/operationEntities";
import { createErrorStatus } from "@renderer/features/operation/helpers/statusFactory";

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
