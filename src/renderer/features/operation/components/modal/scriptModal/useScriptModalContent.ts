// src/renderer/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useState } from "react";
import type {
  OperationViewItem,
  JobResult,
} from "@shared/types/operation/operationTypes";
import { useAppStore } from "@renderer/store";
import { operationService } from "@renderer/features/operation/operationService";

interface ScriptFileItem {
  name: string;
  path: string;
}

type ExecutionState = "idle" | "completed" | "needsAction" | "error";

export interface InfoBoxMessage {
  text: string;
  type: "info" | "success" | "warning" | "error";
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

function getExecutionState(result: JobResult): ExecutionState {
  if (result.success === false || result.kind === "error") {
    return "error";
  }

  if (result.kind === "needsAction") {
    return "needsAction";
  }

  return "completed";
}

function getInfoMessage(
  executionState: ExecutionState,
  executionResult: JobResult | null,
  workName: string | undefined,
  scriptKey: string,
): InfoBoxMessage {
  switch (executionState) {
    case "error":
      return {
        text: "エラーが発生しました",
        type: "error",
      };

    case "needsAction":
      return {
        text: "要対応",
        type: "warning",
      };

    case "completed":
      if (executionResult?.kind === "difference") {
        return {
          text: "差分あり",
          type: "error",
        };
      }

      return {
        text: "正常終了しました",
        type: "success",
      };

    case "idle":
      return {
        text: workName
          ? `${workName} (${scriptKey})`
          : `スクリプト実行 (${scriptKey})`,
        type: "info",
      };
  }
}

export function useScriptModalContent(
  item: OperationViewItem | null | undefined,
  scriptKey: string,
) {
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );
  const [isExecuting, setIsExecuting] = useState(false);

  const matchedKey = item?.ScriptKeys?.find(
    (key) => key.key.trim().toLowerCase() === scriptKey.trim().toLowerCase(),
  );
  const isFileSelectionRequired = Boolean(matchedKey?.requiresFileSelection);

  const kanriNo = String(item?.kanriNo ?? "");
  const targetName = item?.workName;

  const isFinished = executionState !== "idle";
  const isDropZoneVisible = !isFinished && isFileSelectionRequired;
  const isExecutable =
    !isFinished &&
    !isExecuting &&
    Boolean(kanriNo) &&
    Boolean(scriptKey) &&
    (!isFileSelectionRequired || selectedFiles.length > 0);

  const infoMessage = getInfoMessage(
    executionState,
    executionResult,
    targetName,
    scriptKey,
  );

  const handleFileSelect = useCallback((files: File[]) => {
    const items = toScriptFileItems(files);

    if (items.length === 0) {
      return;
    }

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

    try {
      const result = await operationService.executeScriptJob({
        kanriNo,
        scriptKey,
        targetName,
        filePath: filePaths.length > 0 ? filePaths : undefined,
        ignoreDependencies: true,
      });

      setExecutionResult(result);
      setExecutionState(getExecutionState(result));
      setSelectedFiles([]);
    } catch (error) {
      const message = toErrorMessage(error);

      setExecutionResult({
        success: false,
        kind: "error",
        message,
      });
      setExecutionState("error");
    } finally {
      setIsExecuting(false);
    }
  }, [
    kanriNo,
    scriptKey,
    isExecuting,
    isFileSelectionRequired,
    selectedFiles,
    targetName,
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
