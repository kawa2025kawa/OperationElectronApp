// src/renderer/features/operation/components/modal/scriptModal/hooks/useScriptModalContent.ts

import {
  createContext,
  createElement,
  use,
  useCallback,
  useContext,
  useState,
} from "react";
import type { ReactNode } from "react";

import { getManualScriptKeys } from "@shared/config/operationScriptRegistry";
import type { MasterRow } from "@renderer/features/operation/helpers/entityUtils";
import { executeScriptJob } from "@renderer/features/operation/services/scriptJobService";
import { useAppStore } from "@renderer/store";
import type { JobResult } from "@shared/types/operation/operationTypes";

interface ScriptFileItem {
  name: string;
  path: string;
}

type ExecutionState = "idle" | "completed" | "error";

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

function useScriptModalContentValue(item?: MasterRow | null) {
  const closeGlobalModal = useAppStore((state) => state.closeGlobalModal);
  const setGlobalProcessing = useAppStore((state) => state.setGlobalProcessing);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );
  const [isExecuting, setIsExecuting] = useState(false);

  const rawKanriNo = String(item?.kanriNo ?? "");
  const scriptKeys = rawKanriNo ? getManualScriptKeys(rawKanriNo) : [];

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
  const isHighlightError = isError || isDiffResult;

  let messageText: string;

  if (isError) {
    messageText = "処理が失敗しました";
  } else if (executionState === "completed") {
    messageText = isDiffResult ? "差分が発生しました" : "正常に完了しました";
  } else if (isDropZoneVisible) {
    messageText = "対象ファイルをドロップしてください";
  } else {
    messageText = item?.workName
      ? `${item.workName} (${activeKey})`
      : `スクリプト実行 (${activeKey})`;
  }

  const handleSelectScriptKey = useCallback((key: string) => {
    setSelectedScriptKey(key);
    setSelectedFiles([]);
    setExecutionState("idle");
    setExecutionResult(null);
  }, []);

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

  const handleExecute = useCallback(async () => {
    if (!rawKanriNo || !activeKey || isExecuting) {
      return;
    }

    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);

    if (isFileSelectionRequired && filePaths.length === 0) {
      return;
    }

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

      if (result.success === false) {
        setExecutionState("error");
      } else {
        setExecutionState("completed");
      }

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
      messageText,
      selectedFiles,
      executionResult,
      isFinished,
      isDropZoneVisible,
      isHighlightError,
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

type ScriptModalContextType = ReturnType<typeof useScriptModalContentValue>;

const ScriptModalContext = createContext<ScriptModalContextType | null>(null);

export interface ScriptModalProviderProps {
  item: MasterRow;
  children: ReactNode;
}

export function ScriptModalProvider({
  item,
  children,
}: ScriptModalProviderProps) {
  const value = useScriptModalContentValue(item);

  return createElement(ScriptModalContext.Provider, { value }, children);
}

export function useScriptModalContent(): ScriptModalContextType {
  const context = use(ScriptModalContext);

  if (!context) {
    throw new Error(
      "useScriptModalContent must be used within ScriptModalProvider",
    );
  }

  return context;
}
