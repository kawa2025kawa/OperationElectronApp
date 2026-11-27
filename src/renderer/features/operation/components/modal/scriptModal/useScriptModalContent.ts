// src/renderer/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useMemo, useRef, useState } from "react";
import { operationService } from "@renderer/features/operation/service/operationService";
import { getScriptFileRule } from "@renderer/features/operation/utils/scriptFileRules";
import {
  getScriptExecutionState,
  getScriptInfoMessage,
  SCRIPT_MODAL_LABELS,
  toScriptFileItems,
  type InfoBoxMessage,
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
  const currentMode = useAppStore((state) => state.currentMode);
  const fetchTableData = useAppStore((state) => state.fetchTableData);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [executionState, setExecutionState] =
    useState<ScriptExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const isExecutingRef = useRef(false);

  const matchedKey = item?.ScriptKeys?.find(
    (key) => key.key.trim().toLowerCase() === scriptKey.trim().toLowerCase(),
  );
  const isFileSelectionRequired = Boolean(matchedKey?.requiresFileSelection);
  const fileRule = useMemo(
    () => getScriptFileRule(matchedKey?.key ?? scriptKey),
    [matchedKey?.key, scriptKey],
  );

  const selectionStatus = useMemo(
    () => fileRule?.getSelectionStatus(selectedFiles),
    [fileRule, selectedFiles],
  );

  const kanriNo = String(item?.kanriNo ?? "");
  const targetName = item?.workName;

  const isFinished = executionState !== "idle";
  const isDropZoneVisible = !isFinished && isFileSelectionRequired;
  const isFileConditionMet = !isFileSelectionRequired
    ? true
    : selectedFiles.length > 0 && (selectionStatus?.isReadyToExecute ?? true);

  const isExecuteDisabled =
    isFinished ||
    isExecuting ||
    !kanriNo ||
    !scriptKey ||
    !isFileConditionMet;

  const idleMessage = useMemo<InfoBoxMessage | null>(() => {
    if (validationError) {
      return { text: validationError, type: "error" };
    }
    if (selectionStatus?.message) {
      return selectionStatus.message;
    }
    if (fileRule?.initialMessage) {
      return { text: fileRule.initialMessage, type: "info" };
    }
    return null;
  }, [validationError, selectionStatus?.message, fileRule?.initialMessage]);

  const infoMessage = getScriptInfoMessage(
    executionState,
    executionResult,
    idleMessage,
  );

  const handleFileSelect = useCallback(
    (files: File[]) => {
      if (isExecutingRef.current) return;

      const items = toScriptFileItems(files);
      if (items.length === 0) return;

      setSelectedFiles((current) => {
        const existingPaths = new Set(current.map((file) => file.path));
        const uniqueIncoming = items.filter(
          (file) => !existingPaths.has(file.path),
        );

        if (uniqueIncoming.length === 0) {
          return current;
        }

        if (fileRule) {
          const error = fileRule.validateIncomingFiles(uniqueIncoming, current);
          if (error) {
            setValidationError(error);
            return current;
          }
        }

        setValidationError(null);
        return [...current, ...uniqueIncoming];
      });
    },
    [fileRule],
  );

  const handleRemoveFile = useCallback((index: number) => {
    if (isExecutingRef.current) return;

    setValidationError(null);
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
    if (isExecuteDisabled || isExecutingRef.current) return;

    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);
    if (isFileSelectionRequired && filePaths.length === 0) return;

    isExecutingRef.current = true;
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
      setValidationError(null);
    } catch (error) {
      setExecutionResult({
        success: false,
        kind: "error",
        message: toErrorMessage(error),
      });
      setExecutionState("error");
    } finally {
      isExecutingRef.current = false;
      setIsExecuting(false);
    }
  }, [
    isExecuteDisabled,
    selectedFiles,
    isFileSelectionRequired,
    kanriNo,
    scriptKey,
    targetName,
    fetchTableData,
    currentMode,
  ]);

  useModalFooterSync({
    isProcessing: isExecuting,
    hideActions: isFinished,
    cancelLabel: SCRIPT_MODAL_LABELS.CANCEL_BUTTON,
    isCancelDisabled: isExecuting,
    executeLabel: isExecuting
      ? SCRIPT_MODAL_LABELS.EXECUTING_BUTTON
      : SCRIPT_MODAL_LABELS.EXECUTE_BUTTON,
    isExecuteDisabled,
    onExecute: handleExecute,
  });

  return {
    state: {
      infoMessage,
      selectedFiles,
      dropZoneAccept: fileRule?.accept,
      dropZoneLabel: fileRule?.dropLabel,
      executionResult,
      isExecuting,
      isFinished,
      isDropZoneVisible,
      defaultArtifactName: SCRIPT_MODAL_LABELS.DEFAULT_ARTIFACT_NAME,
    },
    actions: {
      handleFileSelect,
      handleRemoveFile,
      handleOpenArtifact,
    },
  };
}