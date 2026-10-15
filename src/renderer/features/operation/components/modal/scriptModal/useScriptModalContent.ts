// src/renderer/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useState } from "react";
import type {
  OperationViewItem,
  JobResult,
} from "@shared/types/operation/operationTypes";
import { executeScriptJob } from "@renderer/features/operation/services/scriptJobService";
import { useAppStore } from "@renderer/store";

interface ScriptFileItem {
  name: string;
  path: string;
}

type ExecutionState = "idle" | "completed" | "error";

export interface InfoBoxMessage {
  text: string;
  type: "info" | "success" | "error";
}

function getFilePath(file: File): string {
  if ("path" in file && typeof file.path === "string") {
    return file.path;
  }
  return window.electronAPI.getFilePath(file) || file.name;
}

function toScriptFileItems(files: File[]): ScriptFileItem[] {
  return files
    .map((file) => ({
      name: file.name,
      path: getFilePath(file),
    }))
    .filter(({ path }) => Boolean(path));
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useScriptModalContent(
  item: OperationViewItem | null | undefined,
  scriptKey: string,
) {
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const setGlobalProcessing = useAppStore((state) => state.setGlobalProcessing);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );
  const [isExecuting, setIsExecuting] = useState(false);

  const matchedKey = item?.ScriptKeys?.find(
    (k) => k.key.trim().toLowerCase() === scriptKey.trim().toLowerCase(),
  );
  const isFileSelectionRequired = Boolean(matchedKey?.requiresFileSelection);

  const kanriNo = String(item?.kanriNo ?? "");
  const isFinished = executionState !== "idle";
  const isDropZoneVisible = !isFinished && isFileSelectionRequired;
  const isExecutable =
    !isFinished &&
    !isExecuting &&
    Boolean(kanriNo) &&
    Boolean(scriptKey) &&
    (!isFileSelectionRequired || selectedFiles.length > 0);

  const infoMessage: InfoBoxMessage = (() => {
    if (executionState === "error") {
      return { text: "エラーが発生しました", type: "error" };
    }
    if (executionState === "completed") {
      const isDifference = executionResult?.kind === "difference";
      return {
        text: isDifference ? "差分あり" : "正常終了しました",
        type: isDifference ? "error" : "success",
      };
    }
    return {
      text: item?.workName
        ? `${item.workName} (${scriptKey})`
        : `スクリプト実行 (${scriptKey})`,
      type: "info",
    };
  })();

  const handleFileSelect = useCallback((files: File[]) => {
    const items = toScriptFileItems(files);
    if (items.length === 0) return;
    setSelectedFiles((current) => [...current, ...items]);
    setExecutionState("idle");
    setExecutionResult(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }, []);

  const handleExecute = useCallback(async () => {
    if (!kanriNo || !scriptKey || isExecuting) {
      return;
    }
    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);
    if (isFileSelectionRequired && filePaths.length === 0) {
      return;
    }

    setIsExecuting(true);
    setGlobalProcessing({
      message: "処理中...",
      target: item?.workName || scriptKey,
    });

    try {
      const result = await executeScriptJob(
        useAppStore.getState(),
        kanriNo,
        scriptKey,
        filePaths.length > 0 ? filePaths : undefined,
      );
      setExecutionResult(result);
      setExecutionState(result.success === false ? "error" : "completed");
      setSelectedFiles([]);
    } catch (error) {
      setExecutionResult({
        success: false,
        kind: "error",
        message: toErrorMessage(error),
      });
      setExecutionState("error");
    } finally {
      setIsExecuting(false);
      setGlobalProcessing(null);
    }
  }, [
    kanriNo,
    scriptKey,
    isExecuting,
    isFileSelectionRequired,
    selectedFiles,
    item?.workName,
    setGlobalProcessing,
  ]);

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
      isRequirementLoading: false,
      requirementError: null,
    },
    actions: {
      handleFileSelect,
      handleRemoveFile,
      handleExecute,
      handleClose: closeGlobalModal,
    },
  };
}
