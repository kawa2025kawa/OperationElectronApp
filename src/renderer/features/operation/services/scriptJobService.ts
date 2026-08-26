// src/renderer/features/operation/services/scriptJobService.ts

import { toast } from "sonner";
import { commands } from "@shared/api/commands";
import type { AppState } from "@shared/store";
import {
  type JobExecutionOptions,
  validateJobDependencies,
} from "@renderer/features/operation/helpers/dependencyHelper";
import { runJobWithGlobalProcessing } from "@renderer/features/operation/helpers/jobRunnerHelper";
import {
  findEntityByKanriNo,
  getAllEntities as getAllEntitiesMap,
} from "@renderer/features/operation/helpers/operationEntities";
import {
  createErrorStatus,
  createRunningStatus,
  createSuccessStatus,
} from "@renderer/features/operation/helpers/statusFactory";

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
