// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import React, { useCallback, useEffect, useState } from "react";

import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import type { JobArtifact, JobResult } from "@shared/types/operation";
import { useAppStore } from "@renderer/store";
import { commands } from "@renderer/services/commands";
import { useOperationModalContext } from "../OperationModalContext";
import * as styles from "./scriptModalContent.css";

// ============================================================================
// Types
// ============================================================================

/**
 * スクリプト実行時に選択されたファイル。
 */
export interface ScriptFileItem {
  name: string;
  path: string;
}

type ExecutionState = "idle" | "completed" | "error";

// ============================================================================
// Constants
// ============================================================================

/**
 * ファイル選択が必要なJob。
 */
const FILE_SELECTION_JOB_IDS = new Set(["E5", "E14", "E29", "E30"]);

/**
 * FileDropZoneで許可する拡張子。
 */
const FILE_ACCEPT = ".xlsx,.csv";

// ============================================================================
// Helpers
// ============================================================================

/**
 * 管理No.をUI上で利用する文字列へ正規化する。
 */
function normalizeKanriNo(kanriNo: string | number | undefined): string {
  return String(kanriNo ?? "").trim();
}

/**
 * 指定されたJobがファイル選択を必要とするか判定する。
 */
function requiresFileSelection(kanriNo: string): boolean {
  return FILE_SELECTION_JOB_IDS.has(kanriNo);
}

/**
 * Electron上のFileから実ファイルパスを取得する。
 */
function extractFilePath(file: File): string {
  return (
    commands.getFilePath(file) ||
    ("path" in file && typeof file.path === "string" ? file.path : "") ||
    file.name
  );
}

/**
 * File[]をUI用のScriptFileItem[]へ変換する。
 */
function convertFilesToItems(files: File[]): ScriptFileItem[] {
  return files
    .map(
      (file): ScriptFileItem => ({
        name: file.name,
        path: extractFilePath(file),
      }),
    )
    .filter(({ path }) => Boolean(path));
}

/**
 * 実行結果が差分結果か判定する。
 */
function isDiffExecutionResult(result: JobResult | null): boolean {
  return result?.message.includes("差分あり") ?? false;
}

/**
 * Errorをユーザー表示用メッセージへ変換する。
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ============================================================================
// Component
// ============================================================================

export const ScriptModalContent = React.memo(function ScriptModalContent() {
  const { registerPrimaryAction } = useOperationModalContext();

  const selectedItem = useAppStore(selectActiveSelectedItem);

  const runScriptJob = useAppStore((state) => state.runScriptJob);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);

  const [executionState, setExecutionState] = useState<ExecutionState>("idle");

  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );

  // ------------------------------------------------------------------------
  // Derived State
  // ------------------------------------------------------------------------

  const kanriNo = normalizeKanriNo(selectedItem?.kanriNo);

  const isFinished = executionState !== "idle";

  const isError = executionState === "error";

  const isFileSelectionRequired = requiresFileSelection(kanriNo);

  const isDropZoneVisible = !isFinished && isFileSelectionRequired;

  const isExecutable =
    !isFinished &&
    Boolean(kanriNo) &&
    (!isFileSelectionRequired || selectedFiles.length > 0);

  const isDiffResult = isDiffExecutionResult(executionResult);

  const isHighlightError = isError || isDiffResult;

  // ------------------------------------------------------------------------
  // File Selection
  // ------------------------------------------------------------------------

  const handleFileSelect = useCallback((files: File[]) => {
    const items = convertFilesToItems(files);

    if (items.length === 0) {
      return;
    }

    setSelectedFiles((currentFiles) => [...currentFiles, ...items]);

    setExecutionState("idle");
    setExecutionResult(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }, []);

  // ------------------------------------------------------------------------
  // Execution
  // ------------------------------------------------------------------------

  const handleExecute = useCallback(async () => {
    if (!kanriNo) {
      return;
    }

    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);

    if (isFileSelectionRequired && filePaths.length === 0) {
      return;
    }

    try {
      const result = await runScriptJob(
        kanriNo,
        filePaths.length > 0 ? filePaths : undefined,
      );

      setExecutionResult(result);
      setExecutionState("completed");
    } catch (error) {
      setExecutionResult({
        message: getErrorMessage(error),
      });

      setExecutionState("error");
    } finally {
      setSelectedFiles([]);
    }
  }, [isFileSelectionRequired, kanriNo, runScriptJob, selectedFiles]);

  // ------------------------------------------------------------------------
  // Modal Primary Action
  // ------------------------------------------------------------------------

  useEffect(() => {
    registerPrimaryAction(isExecutable ? handleExecute : undefined, {
      disabled: !isExecutable,
    });

    return () => {
      registerPrimaryAction(undefined, {
        disabled: true,
      });
    };
  }, [handleExecute, isExecutable, registerPrimaryAction]);

  // ------------------------------------------------------------------------
  // Message
  // ------------------------------------------------------------------------

  let messageText = "スクリプトを実行しますか？";

  if (isError) {
    messageText = "エラーが発生しました";
  } else if (executionState === "completed") {
    messageText = isDiffResult ? "処理完了（差分あり）" : "正常に完了しました";
  } else if (isDropZoneVisible) {
    messageText = "ファイルをドロップするか選択してください";
  }

  // ------------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------------

  return (
    <div className={styles.contentFlexContainer}>
      <div className={styles.messageContainer}>
        <p className={styles.mainMessage}>{messageText}</p>
      </div>

      <div className={styles.bottomArea}>
        {isFinished && executionResult ? (
          <ExecutionResultView
            result={executionResult}
            highlightError={isHighlightError}
          />
        ) : (
          isDropZoneVisible && (
            <FileDropZone
              files={selectedFiles}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              accept={FILE_ACCEPT}
            />
          )
        )}
      </div>
    </div>
  );
});

ScriptModalContent.displayName = "ScriptModalContent";

// ============================================================================
// Execution Result View
// ============================================================================

interface ExecutionResultViewProps {
  result: JobResult;
  highlightError: boolean;
}

const ExecutionResultView = React.memo(function ExecutionResultView({
  result,
  highlightError,
}: ExecutionResultViewProps) {
  return (
    <div>
      <div
        className={highlightError ? styles.commentBoxError : styles.commentBox}
      >
        {result.message}
      </div>

      {result.artifacts && result.artifacts.length > 0 && (
        <ArtifactList artifacts={result.artifacts} />
      )}
    </div>
  );
});

ExecutionResultView.displayName = "ExecutionResultView";

// ============================================================================
// Artifact List
// ============================================================================

interface ArtifactListProps {
  artifacts: JobArtifact[];
}

const ArtifactList = React.memo(function ArtifactList({
  artifacts,
}: ArtifactListProps) {
  if (artifacts.length === 0) {
    return null;
  }

  const handleOpenArtifact = useCallback(async (path: string) => {
    try {
      await commands.openExternal(path);
    } catch (error) {
      console.error("Failed to open artifact:", error);
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "12px",
      }}
    >
      {artifacts.map((artifact) => (
        <button
          key={artifact.path}
          type="button"
          className={styles.linkCardButton}
          onClick={() => void handleOpenArtifact(artifact.path)}
        >
          <span className={styles.linkLabel}>{artifact.name ?? "成果物"}:</span>
          <span className={styles.linkValue}>{artifact.path}</span>
        </button>
      ))}
    </div>
  );
});

ArtifactList.displayName = "ArtifactList";
