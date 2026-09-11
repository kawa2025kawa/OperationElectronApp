// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { OperationItem } from "@shared/types/operation";
import { ExecutionResultView } from "./ExecutionResultView";
import {
  ScriptModalProvider,
  useScriptModalContent,
} from "./hooks/useScriptModalContent";
import * as styles from "./scriptModalContent.css";

const FILE_ACCEPT = ".xlsx,.csv";

// 🎯【修正】kanriNo をオプショナルプロパティとして追加
interface ScriptModalContentProps {
  item: OperationItem;
  kanriNo?: string;
}

/**
 * モーダル本文領域
 */
const ScriptModalBody: React.FC = React.memo(function ScriptModalBody() {
  const { state, actions } = useScriptModalContent();
  const updateModalConfig = useAppStore((s) => s.updateModalConfig);
  const closeModal = useAppStore((s) => s.closeGlobalModal);

  // 🎯 状態の変化に合わせてフッターボタンをリアルタイム注入
  useEffect(() => {
    if (state.isFinished) {
      updateModalConfig({
        footerContent: (
          <ActionButton variant="default" onClick={closeModal}>
            閉じる
          </ActionButton>
        ),
      });
      return;
    }

    updateModalConfig({
      footerContent: (
        <>
          <ActionButton
            variant="default"
            onClick={closeModal}
            disabled={state.isExecuting}
          >
            キャンセル
          </ActionButton>
          <ActionButton
            variant="default"
            onClick={actions.handleExecute}
            disabled={state.isExecuteDisabled || state.isExecuting}
          >
            {state.isExecuting ? "実行中..." : "実行"}
          </ActionButton>
        </>
      ),
    });
  }, [
    state.isFinished,
    state.isExecuting,
    state.isExecuteDisabled,
    actions.handleExecute,
    updateModalConfig,
    closeModal,
  ]);

  return (
    <div className={styles.contentFlexContainer}>
      <div className={styles.messageContainer}>
        <p className={styles.mainMessage}>{state.messageText}</p>
      </div>

      <div className={styles.bottomArea}>
        {state.isFinished && state.executionResult ? (
          <ExecutionResultView
            result={state.executionResult}
            highlightError={state.isHighlightError}
          />
        ) : (
          state.isDropZoneVisible && (
            <FileDropZone
              files={state.selectedFiles}
              onFileSelect={actions.handleFileSelect}
              onRemoveFile={actions.handleRemoveFile}
              accept={FILE_ACCEPT}
            />
          )
        )}
      </div>
    </div>
  );
});

/**
 * 🎯 メインコンポーネント: Provider で包んで内部とコンテキスト共有
 */
export const ScriptModalContent: GlobalModalComponent<ScriptModalContentProps> =
  React.memo(function ScriptModalContent({ item, kanriNo }) {
    // 🎯 kanriNo が指定されていれば item の kanriNo を上書きして Provider に渡す
    const targetItem = kanriNo ? { ...item, kanriNo } : item;

    return (
      <ScriptModalProvider item={targetItem}>
        <ScriptModalBody />
      </ScriptModalProvider>
    );
  });

// 🎯 安全な 16:9 アスペクト比サイズ
ScriptModalContent.modalSize = {
  width: "min(85vw, calc(75vh * 16 / 9))",
  height: "min(75vh, calc(85vw * 9 / 16))",
};

ScriptModalContent.displayName = "ScriptModalContent";
