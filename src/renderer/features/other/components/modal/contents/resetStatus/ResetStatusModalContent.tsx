// src/renderer/features/other/components/modal/contents/resetStatus/ResetStatusModalContent.tsx

import { memo, useCallback, useState } from "react";
import { format } from "date-fns";
import * as scriptStyles from "@renderer/features/operation/components/modal/scriptModal/scriptModalContent.css";
import { useModalFooterSync } from "@renderer/hooks/useModalFooterSync";
import { useAppStore } from "@renderer/store";
import { toErrorMessage } from "@renderer/utils/rendererUtils";
import type { GlobalModalComponent } from "@shared/types/ui/modal";

type ResetExecutionState = "idle" | "completed" | "error";

interface ResetInfoMessage {
  text: string;
  type: "info" | "success" | "error";
}

export const ResetStatusModalContent: GlobalModalComponent = memo(
  function ResetStatusModalContent() {
    const resetAllOperationStatuses = useAppStore(
      (state) => state.resetAllOperationStatuses,
    );

    const [executionState, setExecutionState] =
      useState<ResetExecutionState>("idle");
    const [isExecuting, setIsExecuting] = useState(false);
    const [resultDetailText, setResultDetailText] = useState<string | null>(
      null,
    );

    const isFinished = executionState !== "idle";

    const infoMessage: ResetInfoMessage =
      executionState === "completed"
        ? { text: "すべてのステータスを初期化しました", type: "success" }
        : executionState === "error"
          ? { text: "エラーが発生しました", type: "error" }
          : {
              text: "すべてのステータスを初期化（未実行）に戻しますか？",
              type: "info",
            };

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
        setResultDetailText(
          toErrorMessage(
            error,
            "ステータスのリセット中にエラーが発生しました。",
          ),
        );
        setExecutionState("error");
      } finally {
        setIsExecuting(false);
      }
    }, [isExecuting, isFinished, resetAllOperationStatuses]);

    useModalFooterSync({
      message: undefined,
      isProcessing: isExecuting,
      hideActions: isFinished,
      isCancelDisabled: isExecuting,
      executeLabel: isExecuting ? "リセット中..." : "リセット実行",
      isExecuteDisabled: isExecuting,
      onExecute: handleReset,
    });

    const bodyText =
      isFinished && resultDetailText
        ? resultDetailText
        : isExecuting
          ? "マスタデータの再読み込みと全ステータスの初期化を実行しています..."
          : "現在の作業ステータス・開始／終了時刻・コメントをすべて初期状態（予定）にリセットします。\n※ この操作は元に戻せません。";

    return (
      <div className={scriptStyles.contentFlexContainer}>
        <div className={scriptStyles.infoBoxVariants[infoMessage.type]}>
          {infoMessage.text}
        </div>

        <div className={scriptStyles.mainContainer}>
          <pre className={scriptStyles.rawTextContent}>{bodyText}</pre>
        </div>
      </div>
    );
  },
);

ResetStatusModalContent.displayName = "ResetStatusModalContent";
