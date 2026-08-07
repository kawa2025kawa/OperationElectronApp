// src/shared/store/slices/services/scriptService.ts

import { toast } from "sonner";
import { commands } from "@shared/api/commands";
import type {
  OperationItem,
  JobDependenciesJson,
} from "@shared/types/operationType";
import { unwrapResult } from "@shared/utils/apiUtils";

import { checkJobDependencies } from "../helpers/dependencyHelper";
import { validateJob114Log } from "../helpers/logValidator";
import {
  createErrorStatus,
  createRunningStatus,
  createSuccessStatus,
} from "../helpers/statusFactory";

export const scriptService = {
  async executeScript(
    kanriNo: string,
    allEntities: Record<string, OperationItem>,
    jobDependencies: JobDependenciesJson | null,
    updateStatus: (status: OperationItem) => void,
  ): Promise<void> {
    const item = allEntities[kanriNo];

    if (!item) {
      throw new Error(`対象データがありません: ${kanriNo}`);
    }

    const dependencyOk = checkJobDependencies(
      kanriNo,
      allEntities,
      jobDependencies ?? { dependencies: {} },
    );

    if (!dependencyOk) {
      const errorMessage = "依存ジョブが未完了です";

      updateStatus(createErrorStatus(kanriNo, item, errorMessage));

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    updateStatus(createRunningStatus(kanriNo, item, "スクリプト実行中..."));

    try {
      const result = await commands.executeScript(kanriNo);

      const logText = unwrapResult(result, "スクリプト実行に失敗しました");

      if (logText) {
        const validation = validateJob114Log(logText);

        if (!validation.isValid) {
          const errorMessage = `ログ判定エラー: ${validation.message}`;

          updateStatus(createErrorStatus(kanriNo, item, errorMessage));

          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        updateStatus(
          createSuccessStatus(kanriNo, item, `完了 (${validation.message})`),
        );

        return;
      }

      updateStatus(createSuccessStatus(kanriNo, item, "スクリプト実行完了"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      updateStatus(createErrorStatus(kanriNo, item, `実行エラー: ${message}`));

      toast.error(`スクリプト実行エラー: ${message}`);

      throw error;
    }
  },
};
