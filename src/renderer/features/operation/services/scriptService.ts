// src/renderer/features/operation/services/scriptService.ts

import { toast } from "sonner";
import { commands } from "@shared/api/commands";
import {
  checkJobDependencies,
  type MissingDependency,
} from "@renderer/features/operation/helpers/dependencyHelper";
import {
  createErrorStatus,
  createRunningStatus,
  createSuccessStatus,
} from "@renderer/features/operation/helpers/statusFactory";
import type { OperationItem } from "@shared/types/operationType";

const NO_DEPENDENCY_MESSAGE = "前提条件を満たしていません";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getStatusLabel = (
  status: NonNullable<MissingDependency["status"]>,
): string => {
  switch (status) {
    case "scheduled":
      return "未実行";
    case "running":
      return "実行中";
    case "scriptRunning":
      return "処理中";
    case "ready":
      return "実行可";
    case "waiting":
      return "待機中";
    case "success":
      return "完了";
    case "error":
      return "エラー";
    default:
      return status;
  }
};

const createDependencyErrorComment = (
  dependencies: MissingDependency[],
): string => {
  if (dependencies.length === 0) {
    return NO_DEPENDENCY_MESSAGE;
  }
  const details = dependencies.map(({ kanriNo, status }) => {
    const label = status ? getStatusLabel(status) : "未実行";
    return `${kanriNo}: ${label}`;
  });
  return `前提未完了: ${details.join(" ")}`;
};

export const scriptService = {
  async executeScript(
    kanriNo: string,
    allEntities: Record<string, OperationItem>,
    updateStatus: (status: OperationItem) => void,
  ): Promise<void> {
    const item = allEntities[kanriNo];
    if (!item) {
      const message = `対象データが存在しません: ${kanriNo}`;
      toast.error(message);
      throw new Error(message);
    }

    const dependencyResult = checkJobDependencies(kanriNo, allEntities);

    if (!dependencyResult.ok) {
      const comment = createDependencyErrorComment(
        dependencyResult.missingDependencies,
      );
      updateStatus({
        ...item,
        comment,
      });
      toast.warning(comment);
      return;
    }

    updateStatus(createRunningStatus(kanriNo, item, "スクリプト実行中..."));

    try {
      const resultMessage = await commands.executeScript(kanriNo);
      updateStatus(
        createSuccessStatus(
          kanriNo,
          item,
          resultMessage || "スクリプト実行完了",
        ),
      );
    } catch (error) {
      const message = getErrorMessage(error);
      const comment = `スクリプト実行エラー: ${message}`;
      updateStatus(createErrorStatus(kanriNo, item, comment));
      toast.error(comment);
      throw error;
    }
  },
};
