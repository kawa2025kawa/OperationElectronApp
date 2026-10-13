// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import { memo, useCallback, useEffect } from "react";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import type { JobArtifact } from "@shared/types/operation/operationTypes";
import { trpc } from "@renderer/lib/trpc";
import { useScriptModalContent } from "./useScriptModalContent";
import * as styles from "./scriptModalContent.css";

interface ScriptModalContentProps {
  item: OperationViewItem;
}

export const ScriptModalContent: GlobalModalComponent<ScriptModalContentProps> =
  memo(function ScriptModalContent({ item }) {
    const { state, actions } = useScriptModalContent(item);
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
        await trpc.system.openExternal.mutate({ urlOrPath: path });
      } catch (error) {
        console.error("Failed to open artifact:", error);
      }
    }, []);

    return (
      <div className={styles.contentFlexContainer}>
        {/* 上部: メッセージ・ステータス表示用 Infobox */}
        <div className={styles.infoBoxVariants[state.infoMessage.type]}>
          {state.infoMessage.text}
        </div>

        {/* 複数スクリプト切替セレクター */}
        {state.scriptKeys.length > 1 && !state.isFinished && (
          <div className={styles.scriptSelectorWrapper}>
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

        {/* 下部: 縦スクロールバー付きメインコンテナ */}
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
