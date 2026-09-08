// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import React from "react";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { ExecutionResultView } from "./ExecutionResultView";
import { useScriptModalContent } from "./useScriptModalContent";
import * as styles from "./scriptModalContent.css";

const FILE_ACCEPT = ".xlsx,.csv";

export const ScriptModalContent = React.memo(function ScriptModalContent() {
  const { state, actions } = useScriptModalContent();

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

ScriptModalContent.displayName = "ScriptModalContent";
