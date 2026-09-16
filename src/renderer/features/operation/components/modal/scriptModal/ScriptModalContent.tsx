// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import React, { useEffect } from "react";
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

interface ScriptModalContentProps {
  item: OperationItem;
  kanriNo?: string;
}

const ScriptModalBody: React.FC = React.memo(function ScriptModalBody() {
  const { state, actions } = useScriptModalContent();
  const updateModalConfig = useAppStore((s) => s.updateModalConfig);

  useEffect(() => {
    // 🎯 完了時は空配列を渡すことで、親側でデフォルトの「閉じる」ボタンが自動適用される
    if (state.isFinished) {
      updateModalConfig({
        rightActions: [],
      });
      return;
    }

    updateModalConfig({
      rightActions: [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: actions.handleClose,
          disabled: state.isExecuting,
        },
        {
          id: "execute",
          label: state.isExecuting ? "実行中..." : "実行",
          onClick: actions.handleExecute,
          disabled: state.isExecuteDisabled || state.isExecuting,
          variant: "default",
        },
      ],
    });
  }, [
    state.isFinished,
    state.isExecuting,
    state.isExecuteDisabled,
    actions.handleExecute,
    actions.handleClose,
    updateModalConfig,
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

export const ScriptModalContent: GlobalModalComponent<ScriptModalContentProps> =
  React.memo(function ScriptModalContent({ item, kanriNo }) {
    const targetItem = kanriNo ? { ...item, kanriNo } : item;

    return (
      <ScriptModalProvider item={targetItem}>
        <ScriptModalBody />
      </ScriptModalProvider>
    );
  });

ScriptModalContent.modalSize = {
  width: "min(85vw, calc(75vh * 16 / 9))",
  height: "min(75vh, calc(85vw * 9 / 16))",
};

ScriptModalContent.displayName = "ScriptModalContent";
