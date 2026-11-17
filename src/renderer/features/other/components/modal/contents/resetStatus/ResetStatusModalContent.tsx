// src/renderer/features/other/components/modal/contents/resetStatus/ResetStatusModalContent.tsx

import { memo, useEffect, useMemo } from "react";
import type { GlobalModalComponent, ModalAction } from "@shared/types/ui/modal";
import { useAppStore } from "@renderer/store";
import * as scriptStyles from "@renderer/features/operation/components/modal/scriptModal/scriptModalContent.css";
import { useResetStatusModalContent } from "./useResetStatusModalContent";

export const ResetStatusModalContent: GlobalModalComponent = memo(
  function ResetStatusModalContent() {
    const { state, actions } = useResetStatusModalContent();
    const updateModalConfig = useAppStore((s) => s.updateModalConfig);

    const rightActions = useMemo<ModalAction[]>(() => {
      if (state.isFinished) {
        return [];
      }

      return [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: actions.handleClose,
          disabled: state.isExecuting,
        },
        {
          id: "execute",
          label: state.isExecuting ? "リセット中..." : "リセット実行",
          onClick: actions.handleReset,
          disabled: state.isExecuting,
          variant: "default",
        },
      ];
    }, [
      state.isFinished,
      state.isExecuting,
      actions.handleClose,
      actions.handleReset,
    ]);

    useEffect(() => {
      updateModalConfig({
        message: undefined,
        isProcessing: state.isExecuting,
        rightActions,
      });
    }, [state.isExecuting, rightActions, updateModalConfig]);

    return (
      <div className={scriptStyles.contentFlexContainer}>
        <div className={scriptStyles.infoBoxVariants[state.infoMessage.type]}>
          {state.infoMessage.text}
        </div>

        <div className={scriptStyles.mainContainer}>
          {state.isFinished && state.resultDetailText ? (
            <pre className={scriptStyles.rawTextContent}>
              {state.resultDetailText}
            </pre>
          ) : (
            <pre className={scriptStyles.rawTextContent}>
              {state.isExecuting
                ? "マスタデータの再読み込みと全ステータスの初期化を実行しています..."
                : "現在の作業ステータス・開始／終了時刻・コメントをすべて初期状態（予定）にリセットします。\n※ この操作は元に戻せません。"}
            </pre>
          )}
        </div>
      </div>
    );
  },
);

ResetStatusModalContent.displayName = "ResetStatusModalContent";
