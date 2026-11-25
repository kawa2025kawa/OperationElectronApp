// src/renderer/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useState } from "react";
import { operationService } from "@renderer/features/operation/service/operationService";
import {
  getScriptExecutionState,
  getScriptInfoMessage,
  SCRIPT_MODAL_LABELS,
  toScriptFileItems,
  type ScriptExecutionState,
  type ScriptFileItem,
} from "@renderer/features/operation/utils/scriptModalUtils";
import { useModalFooterSync } from "@renderer/hooks/useModalFooterSync";
import { useAppStore } from "@renderer/store";
import { toErrorMessage } from "@renderer/utils/rendererUtils";
import type {
  JobResult,
  OperationViewItem,
} from "@shared/types/operation/operationTypes";

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
  const isExecuteDisabled = !isExecutable;

  const infoMessage = getScriptInfoMessage(executionState, executionResult);

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

  const handleOpenArtifact = useCallback((artifactPath: string) => {
    void operationService
      .openExternal(artifactPath, "成果物を開けませんでした")
      .catch(() => undefined);
  }, []);

  const handleExecute = useCallback(async () => {
    if (!kanriNo || !scriptKey || isExecuting) return;

    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);
    if (isFileSelectionRequired && filePaths.length === 0) return;

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
      setExecutionResult({
        success: false,
        kind: "error",
        message: toErrorMessage(error),
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

  useModalFooterSync({
    hideActions: isFinished,
    cancelLabel: SCRIPT_MODAL_LABELS.CANCEL_BUTTON,
    isCancelDisabled: isExecuting,
    executeLabel: isExecuting
      ? SCRIPT_MODAL_LABELS.EXECUTING_BUTTON
      : SCRIPT_MODAL_LABELS.EXECUTE_BUTTON,
    isExecuteDisabled: isExecuteDisabled || isExecuting,
    onExecute: handleExecute,
  });

  return {
    state: {
      infoMessage,
      selectedFiles,
      executionResult,
      isFinished,
      isDropZoneVisible,
      isExecutable,
      isExecuteDisabled,
      isExecuting,
      defaultArtifactName: SCRIPT_MODAL_LABELS.DEFAULT_ARTIFACT_NAME,
    },
    actions: {
      handleFileSelect,
      handleRemoveFile,
      handleOpenArtifact,
      handleExecute,
      handleClose: closeGlobalModal,
    },
  };
}
