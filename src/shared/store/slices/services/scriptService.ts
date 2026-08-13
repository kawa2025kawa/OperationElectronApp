// src/shared/store/slices/services/scriptService.ts

import { toast } from "sonner";

import { commands } from "@shared/api/commands";
import type {
  JobDependenciesJson,
  OperationItem,
} from "@shared/types/operationType";

import {
  checkJobDependencies,
  type MissingDependency,
} from "../helpers/dependencyHelper";
import {
  createErrorStatus,
  createRunningStatus,
  createSuccessStatus,
} from "../helpers/statusFactory";

const NO_DEPENDENCY_MESSAGE = "前提条件を満たしていないため実行できません。";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getStatusLabel = (
  status: NonNullable<MissingDependency["status"]>,
): string => {
  switch (status) {
    case "scheduled":
      return "予定";
    case "running":
    case "scriptRunning":
      return "実行中";
    case "ready":
      return "実行待ち";
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
    const label = status ? getStatusLabel(status) : "未登録";
    return `${kanriNo}（現在: ${label}）`;
  });

  return `前提条件未達: ${details.join("、")}`;
};

export const scriptService = {
  async executeScript(
    kanriNo: string,
    allEntities: Record<string, OperationItem>,
    jobDependencies: JobDependenciesJson | null,
    updateStatus: (status: OperationItem) => void,
  ): Promise<void> {
    const item = allEntities[kanriNo];

    if (!item) {
      const message = `対象が存在しません: ${kanriNo}`;

      toast.error(message);
      throw new Error(message);
    }

    const dependencyResult = checkJobDependencies(
      kanriNo,
      allEntities,
      jobDependencies ?? { dependencies: {} },
    );

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

    updateStatus(createRunningStatus(kanriNo, item, "実行中..."));

    try {
      const resultMessage = await commands.executeScript(kanriNo);

      updateStatus(
        createSuccessStatus(kanriNo, item, resultMessage || "実行完了"),
      );
    } catch (error) {
      const message = getErrorMessage(error);
      const comment = `エラー: ${message}`;

      updateStatus(createErrorStatus(kanriNo, item, comment));

      toast.error(comment);
      throw error;
    }
  },
};
