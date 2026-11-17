// src/renderer/features/other/components/modal/contents/resetStatus/useResetStatusModalContent.ts

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { useAppStore } from "@renderer/store";

export type ResetExecutionState = "idle" | "completed" | "error";

export interface ResetInfoMessage {
  text: string;
  type: "info" | "success" | "error";
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "ステータスのリセット中にエラーが発生しました。";
}

export function useResetStatusModalContent() {
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const resetAllOperationStatuses = useAppStore(
    (state) => state.resetAllOperationStatuses,
  );

  const [executionState, setExecutionState] =
    useState<ResetExecutionState>("idle");
  const [isExecuting, setIsExecuting] = useState(false);
  const [resultDetailText, setResultDetailText] = useState<string | null>(null);

  const isFinished = executionState !== "idle";

  const infoMessage: ResetInfoMessage = (() => {
    switch (executionState) {
      case "completed":
        return {
          text: "すべてのステータスを初期化しました",
          type: "success",
        };
      case "error":
        return {
          text: "エラーが発生しました",
          type: "error",
        };
      case "idle":
        return {
          text: "すべてのステータスを初期化（未実行）に戻しますか？",
          type: "info",
        };
    }
  })();

  const handleReset = useCallback(async () => {
    if (isExecuting || isFinished) return;

    setIsExecuting(true);
    setResultDetailText(null);

    try {
      await resetAllOperationStatuses();
      const { tableRowsByMode } = useAppStore.getState();
      const targetCount =
        (tableRowsByMode.operation?.length ?? 0) +
        (tableRowsByMode.today?.length ?? 0);
      const executedAt = format(new Date(), "yyyy/MM/dd HH:mm:ss");

      setResultDetailText(
        `ステータス初期化完了\n対象件数: ${targetCount} 件\n実行日時: ${executedAt}`,
      );
      setExecutionState("completed");
    } catch (error) {
      console.error(
        "[ResetStatusModal] Failed to reset operation statuses:",
        error,
      );
      setResultDetailText(toErrorMessage(error));
      setExecutionState("error");
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, isFinished, resetAllOperationStatuses]);

  return {
    state: {
      infoMessage,
      resultDetailText,
      isExecuting,
      isFinished,
    },
    actions: {
      handleReset,
      handleClose: closeGlobalModal,
    },
  };
}
