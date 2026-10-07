// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import { memo, useEffect } from "react";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { MasterRow } from "@renderer/features/operation/helpers/entityUtils";
import { ExecutionResultView } from "./ExecutionResultView";
import {
  ScriptModalProvider,
  useScriptModalContent,
} from "./hooks/useScriptModalContent";
import * as styles from "./scriptModalContent.css";

const FILE_ACCEPT = ".xlsx,.csv";

interface ScriptModalContentProps {
  item: MasterRow;
}

const ScriptModalBody = memo(function ScriptModalBody() {
  const { state, actions } = useScriptModalContent();
  const updateModalConfig = useAppStore((s) => s.updateModalConfig);

  useEffect(() => {
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
      {/* 複数スクリプトが存在する場合の選択セレクター */}
      {state.scriptKeys.length > 1 && !state.isFinished && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
          }}
        >
          <label style={{ fontSize: "14px", fontWeight: "bold" }}>
            実行スクリプト:
          </label>
          <select
            value={state.selectedScriptKey}
            onChange={(e) => actions.handleSelectScriptKey(e.target.value)}
            disabled={state.isExecuting}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {state.scriptKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      )}

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
  memo(function ScriptModalContent({ item }) {
    return (
      <ScriptModalProvider item={item}>
        <ScriptModalBody />
      </ScriptModalProvider>
    );
  });
