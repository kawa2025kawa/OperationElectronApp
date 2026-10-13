// src/renderer/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useState } from "react";
import type { OperationViewItem } from "@shared/types/operation/operationTypes";
import { executeScriptJob } from "@renderer/features/operation/services/scriptJobService";
import { useAppStore } from "@renderer/store";
import type { JobResult } from "@shared/types/operation/operationTypes";

interface ScriptFileItem {
  name: string;
  path: string;
}

type ExecutionState = "idle" | "completed" | "error";

export interface InfoBoxMessage {
  text: string;
  type: "info" | "success" | "error";
}

const FILE_SELECTION_JOB_IDS = new Set(["E5", "E14", "E29", "E30", "E41"]);

function requiresFileSelection(scriptKey: string): boolean {
  return FILE_SELECTION_JOB_IDS.has(scriptKey.toUpperCase());
}

function extractFilePath(file: File): string {
  if ("path" in file && typeof file.path === "string") {
    return file.path;
  }
  return window.electronAPI.getFilePath(file) || file.name;
}

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

function isDiffExecutionResult(result: JobResult | null): boolean {
  return result?.message.includes("差分") ?? false;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getManualScriptKeys(item?: OperationViewItem | null): string[] {
  if (!item || !("Script" in item) || item.Script !== true) {
    return [];
  }

  if (!("ScriptKeys" in item) || !Array.isArray(item.ScriptKeys)) {
    return [];
  }

  return item.ScriptKeys.filter(
    (entry) =>
      entry.executionType === "manual" &&
      typeof entry.key === "string" &&
      entry.key.trim() !== "",
  ).map((entry) => entry.key.trim());
}

export function useScriptModalContent(item?: OperationViewItem | null) {
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const setGlobalProcessing = useAppStore((state) => state.setGlobalProcessing);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );
  const [isExecuting, setIsExecuting] = useState(false);

  const rawKanriNo = String(item?.kanriNo ?? "");
  const scriptKeys = getManualScriptKeys(item);

  const [selectedScriptKey, setSelectedScriptKey] = useState<string>(
    scriptKeys[0] ?? rawKanriNo,
  );

  const activeKey = selectedScriptKey || rawKanriNo;

  const isFinished = executionState !== "idle";
  const isError = executionState === "error";

  const isFileSelectionRequired = requiresFileSelection(activeKey);
  const isDropZoneVisible = !isFinished && isFileSelectionRequired;

  const isExecutable =
    !isFinished &&
    !isExecuting &&
    Boolean(activeKey) &&
    (!isFileSelectionRequired || selectedFiles.length > 0);

  const isDiffResult = isDiffExecutionResult(executionResult);

  // --- Infobox表示用メッセージ設定 ---
  let infoMessage: InfoBoxMessage;

  if (isError) {
    infoMessage = { text: "処理中にエラーが発生しました", type: "error" };
  } else if (executionState === "completed") {
    infoMessage = {
      text: isDiffResult ? "差分が発生しました" : "正常に完了しました",
      type: isDiffResult ? "error" : "success",
    };
  } else {
    infoMessage = {
      text: item?.workName
        ? `${item.workName} (${activeKey})`
        : `スクリプト実行 (${activeKey})`,
      type: "info",
    };
  }

  const handleSelectScriptKey = useCallback((key: string) => {
    setSelectedScriptKey(key);
    setSelectedFiles([]);
    setExecutionState("idle");
    setExecutionResult(null);
  }, []);

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

  const handleExecute = useCallback(async () => {
    if (!rawKanriNo || !activeKey || isExecuting) return;

    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);
    if (isFileSelectionRequired && filePaths.length === 0) return;

    setIsExecuting(true);
    setGlobalProcessing({
      message: "スクリプト実行中...",
      target: item?.workName || activeKey,
    });

    try {
      const result = await executeScriptJob(
        useAppStore.getState(),
        rawKanriNo,
        activeKey,
        filePaths.length > 0 ? filePaths : undefined,
      );

      setExecutionResult(result);
      setExecutionState(result.success === false ? "error" : "completed");
      setSelectedFiles([]);
    } catch (error) {
      setExecutionResult({
        message: getErrorMessage(error),
      });
      setExecutionState("error");
    } finally {
      setIsExecuting(false);
      setGlobalProcessing(null);
    }
  }, [
    rawKanriNo,
    activeKey,
    isExecuting,
    isFileSelectionRequired,
    item?.workName,
    selectedFiles,
    setGlobalProcessing,
  ]);

  const handleClose = useCallback(() => {
    closeGlobalModal();
  }, [closeGlobalModal]);

  return {
    state: {
      infoMessage,
      selectedFiles,
      executionResult,
      isFinished,
      isDropZoneVisible,
      isExecutable,
      isExecuteDisabled: !isExecutable,
      isExecuting,
      scriptKeys,
      selectedScriptKey: activeKey,
    },
    actions: {
      handleSelectScriptKey,
      handleFileSelect,
      handleRemoveFile,
      handleExecute,
      handleClose,
    },
  };
}
