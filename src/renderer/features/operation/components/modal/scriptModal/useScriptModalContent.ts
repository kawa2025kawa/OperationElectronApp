// src/renderer/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useState } from "react";
import { operationService } from "@renderer/features/operation/service/operationService";
import {
  getScriptExecutionState,
  getScriptInfoMessage,
  toScriptFileItems,
  type InfoBoxMessage,
  type ScriptExecutionState,
  type ScriptFileItem,
} from "@renderer/features/operation/utils/scriptModalUtils";
import { useAppStore } from "@renderer/store";
import type {
  JobResult,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

export type { InfoBoxMessage };

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useScriptModalContent(
  item: OperationViewItem | null | undefined,
  scriptKey: string,
) {
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const currentMode = useAppStore((state) => state.currentMode);
  const fetchTableData = useAppStore((state) => state.fetchTableData);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] =
    useState<ScriptExecutionState>("idle");
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

  const infoMessage = getScriptInfoMessage(executionState, executionResult);

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
        onSuccess: () => fetchTableData(currentMode, true),
      });

      setExecutionResult(result);
      setExecutionState(getScriptExecutionState(result));
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
    fetchTableData,
    currentMode,
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
