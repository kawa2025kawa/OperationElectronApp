// src/renderer/features/operation/components/modal/scriptModal/ScriptModalContent.tsx

import React, { useCallback, useEffect, useState } from "react";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import { commands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import { useOperationModalContext } from "../OperationModalContext";
import * as styles from "./scriptModalContent.css";

export interface ScriptFileItem {
  name: string;
  path: string;
}

type ExecutionState = "idle" | "completed" | "error";

const DROP_ZONE_KANRI_NOS = new Set(["E5", "E29", "E30"]);

const requiresFileSelection = (
  kanriNo: string | number | undefined,
): boolean => {
  return DROP_ZONE_KANRI_NOS.has(String(kanriNo ?? "").trim());
};

const extractFilePath = (file: File): string => {
  const commandPath = commands.getFilePath(file);
  if (commandPath) return commandPath;
  if ("path" in file && typeof file.path === "string") return file.path;
  return file.name;
};

const convertFilesToItems = (files: File[]): ScriptFileItem[] => {
  return files
    .map((file) => ({
      name: file.name,
      path: extractFilePath(file),
    }))
    .filter((file) => Boolean(file.path));
};

export const ScriptModalContent: React.FC = React.memo(() => {
  const { registerPrimaryAction } = useOperationModalContext();
  const selectedItem = useAppStore(selectActiveSelectedItem);
  const runScriptJob = useAppStore((state) => state.runScriptJob);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const kanriNo = selectedItem?.kanriNo;
  const normalizedKanriNo = String(kanriNo ?? "").trim();

  const isFinished = executionState !== "idle";
  const isError = executionState === "error";
  const isFileSelectionRequired = requiresFileSelection(normalizedKanriNo);
  const isDropZoneVisible = !isFinished && isFileSelectionRequired;
  const isExecutable =
    !isFinished && (!isFileSelectionRequired || selectedFiles.length > 0);

  const handleFileSelect = useCallback((files: File[]) => {
    const items = convertFilesToItems(files);
    if (items.length === 0) return;

    setSelectedFiles((currentFiles) => [...currentFiles, ...items]);
    setExecutionState("idle");
    setExecutionResult(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }, []);

  useEffect(() => {
    if (!isExecutable || !kanriNo) {
      registerPrimaryAction(undefined, { disabled: true });
      return;
    }

    const handleExecute = async (): Promise<void> => {
      const filePaths = selectedFiles.map((file) => file.path).filter(Boolean);

      if (isFileSelectionRequired && filePaths.length === 0) {
        return;
      }

      try {
        const resultComment = await runScriptJob(String(kanriNo), filePaths);
        setExecutionResult(resultComment);
        setExecutionState("completed");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setExecutionResult(errorMsg);
        setExecutionState("error");
      } finally {
        setSelectedFiles([]);
      }
    };

    registerPrimaryAction(handleExecute, { disabled: false });

    return () => {
      registerPrimaryAction(undefined, { disabled: true });
    };
  }, [
    isExecutable,
    isFileSelectionRequired,
    kanriNo,
    registerPrimaryAction,
    runScriptJob,
    selectedFiles,
  ]);

  const isDiffResult = executionResult?.includes("【相違あり】") ?? false;
  const isHighlightError = isError || isDiffResult;

  const getMessageText = (): string => {
    if (isError) return "エラーが発生しました";
    if (executionState === "completed") {
      return isDiffResult ? "相違が発生しました" : "処理が完了しました";
    }
    return isDropZoneVisible
      ? "実行対象のファイルを選択またはドロップしてください"
      : "「実行」ボタンを押して処理を開始してください";
  };

  return (
    <div className={styles.contentFlexContainer}>
      <div className={styles.messageContainer}>
        <p className={styles.mainMessage}>{getMessageText()}</p>
      </div>

      <div className={styles.bottomArea}>
        {isFinished && executionResult ? (
          <div
            className={
              isHighlightError ? styles.commentBoxError : styles.commentBox
            }
          >
            {executionResult}
          </div>
        ) : (
          isDropZoneVisible && (
            <FileDropZone
              files={selectedFiles}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              accept=".xlsx,.csv"
            />
          )
        )}
      </div>
    </div>
  );
});

ScriptModalContent.displayName = "ScriptModalContent";
