// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import { memo } from "react";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import type { GlobalModalComponent } from "@renderer/types/modal";
import { useScriptModalContent } from "./useScriptModalContent";
import * as styles from "./scriptModalContent.css";

interface JobArtifact {
  name: string;
  path?: string;
  size?: number;
}

interface ScriptModalContentProps {
  item: OperationViewItem;
  scriptKey: string;
}

export const ScriptModalContent: GlobalModalComponent<ScriptModalContentProps> =
  memo(function ScriptModalContent({ item, scriptKey }) {
    const { state, actions } = useScriptModalContent(item, scriptKey);

    return (
      <div className={styles.contentFlexContainer}>
        <div className={styles.infoBoxVariants[state.infoMessage.type]}>
          {state.infoMessage.text}
        </div>

        <div className={styles.mainContainer}>
          {state.isDropZoneVisible ? (
            <FileDropZone
              files={state.selectedFiles}
              accept={state.dropZoneAccept}
              label={state.dropZoneLabel}
              disabled={state.isExecuting}
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
                        const artifactPath = artifact.path;
                        if (!artifactPath) return null;

                        return (
                          <button
                            key={artifactPath || index}
                            type="button"
                            className={styles.linkCardButton}
                            onClick={() =>
                              actions.handleOpenArtifact(artifactPath)
                            }
                          >
                            <span className={styles.linkLabel}>
                              {artifact.name ?? state.defaultArtifactName}:
                            </span>
                            <span className={styles.linkValue}>
                              {artifactPath}
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

ScriptModalContent.displayName = "ScriptModalContent";
