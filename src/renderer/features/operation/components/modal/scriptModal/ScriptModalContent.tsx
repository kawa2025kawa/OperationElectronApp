// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import { memo, useCallback, useEffect } from "react";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { JobArtifact } from "@shared/types/operation/operationTypes";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import { useScriptModalContent } from "./useScriptModalContent";
import * as styles from "./scriptModalContent.css";

interface ScriptModalContentProps {
  item: OperationViewItem;
  scriptKey: string;
}

export const ScriptModalContent: GlobalModalComponent<ScriptModalContentProps> =
  memo(function ScriptModalContent({ item, scriptKey }) {
    const { state, actions } = useScriptModalContent(item, scriptKey);
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

    const handleOpenArtifact = useCallback(async (path: string) => {
      try {
        await window.electronAPI.invoke(IPC_CHANNELS.SYSTEM.OPEN_EXTERNAL, {
          urlOrPath: path,
        });
      } catch (error) {
        console.error("Failed to open artifact:", error);
      }
    }, []);

    return (
      <div className={styles.contentFlexContainer}>
        <div className={styles.infoBoxVariants[state.infoMessage.type]}>
          {state.infoMessage.text}
        </div>

        <div className={styles.mainContainer}>
          {state.isDropZoneVisible ? (
            <FileDropZone
              files={state.selectedFiles}
              onFileSelect={actions.handleFileSelect}
              onRemoveFile={actions.handleRemoveFile}
            />
          ) : state.isFinished && state.executionResult ? (
            <div>
              <pre className={styles.rawTextContent}>
                {state.executionResult.message}
              </pre>

              {state.executionResult.artifacts &&
                state.executionResult.artifacts.length > 0 && (
                  <div className={styles.artifactList}>
                    {state.executionResult.artifacts.map(
                      (artifact: JobArtifact, index: number) => {
                        if (!artifact.path) return null;

                        return (
                          <button
                            key={artifact.path || index}
                            type="button"
                            className={styles.linkCardButton}
                            onClick={() =>
                              void handleOpenArtifact(artifact.path!)
                            }
                          >
                            <span className={styles.linkLabel}>
                              {artifact.name ?? "成果物"}:
                            </span>
                            <span className={styles.linkValue}>
                              {artifact.path}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
            </div>
          ) : null}
        </div>
      </div>
    );
  });
