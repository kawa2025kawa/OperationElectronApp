// src/renderer/features/operation/components/modal/scriptModal/hooks/useScriptModalContent.ts

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import type { MasterRow } from "@renderer/features/operation/helpers/entityUtils";
import { executeScriptJob } from "@renderer/features/operation/services/scriptJobService";
import { systemCommands } from "@renderer/services/commands";
import { useAppStore } from "@renderer/store";
import type { JobResult } from "@shared/types/operation/operationTypes";

export interface ScriptFileItem {
  name: string;
  path: string;
}

export type ExecutionState = "idle" | "completed" | "error";

const FILE_SELECTION_JOB_IDS = new Set(["E5", "E14", "E29", "E30", "E41"]);

function normalizeKanriNo(kanriNo?: string): string {
  return String(kanriNo ?? "")
    .trim()
    .toUpperCase();
}

function requiresFileSelection(kanriNo: string): boolean {
  return FILE_SELECTION_JOB_IDS.has(kanriNo);
}

function extractFilePath(file: File): string {
  if ("path" in file && typeof file.path === "string") {
    return file.path;
  }

  return systemCommands.getFilePath(file) || file.name;
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
  return result?.message.includes("差分あり") ?? false;
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

  const kanriNo = normalizeKanriNo(item?.kanriNo);
  const isFinished = executionState !== "idle";
  const isError = executionState === "error";
  const isFileSelectionRequired = requiresFileSelection(kanriNo);
  const isDropZoneVisible = !isFinished && isFileSelectionRequired;

  const isExecutable =
    !isFinished &&
    !isExecuting &&
    Boolean(kanriNo) &&
    (!isFileSelectionRequired || selectedFiles.length > 0);

  const isDiffResult = isDiffExecutionResult(executionResult);
  const isHighlightError = isError || isDiffResult;

  const messageText = useMemo(() => {
    if (isError) {
      return "エラーが発生しました";
    }

    if (executionState === "completed") {
      return isDiffResult ? "差分を検出しました" : "正常に完了しました";
    }

    if (isDropZoneVisible) {
      return "ファイルをドロップしてください";
    }

    return item?.workName
      ? `${item.workName} を実行します`
      : "実行ボタンを押してください";
  }, [
    executionState,
    isDiffResult,
    isDropZoneVisible,
    isError,
    item?.workName,
  ]);

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
    if (!kanriNo || isExecuting) {
      return;
    }

    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);

    if (isFileSelectionRequired && filePaths.length === 0) {
      return;
    }

    setIsExecuting(true);

    setGlobalProcessing({
      message: "スクリプト実行中...",
      target: item?.workName || kanriNo,
    });

    try {
      const result = await executeScriptJob(
        useAppStore.getState(),
        kanriNo,
        filePaths.length > 0 ? filePaths : undefined,
      );

      setExecutionResult(result);
      setExecutionState("completed");
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
    isExecuting,
    isFileSelectionRequired,
    item?.workName,
    kanriNo,
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
    },
    actions: {
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
  const context = useContext(ScriptModalContext);

  if (!context) {
    throw new Error(
      "useScriptModalContent must be used within ScriptModalProvider",
    );
  }

  return context;
}
