// electron/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { commands } from "@shared/service/commands";
import { useAppStore } from "@shared/store";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import type { ModalContentProps } from "@renderer/features/operation/components/modal/useOperationModalLogic";

export interface ScriptFileItem {
  name: string;
  path: string;
}

type ExecutionState = "idle" | "completed";

interface UseScriptModalContentParams {
  registerPrimaryAction: ModalContentProps["registerPrimaryAction"];
}

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

export const useScriptModalContent = ({
  registerPrimaryAction,
}: UseScriptModalContentParams) => {
  const selectedItem = useAppStore(selectActiveSelectedItem);
  const runScriptJob = useAppStore((state) => state.runScriptJob);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const kanriNo = selectedItem?.kanriNo;
  const normalizedKanriNo = String(kanriNo ?? "").trim();

  const isCompleted = executionState === "completed";
  const isFileSelectionRequired = requiresFileSelection(normalizedKanriNo);
  const isDropZoneVisible = !isCompleted && isFileSelectionRequired;
  const isExecutable =
    !isCompleted && (!isFileSelectionRequired || selectedFiles.length > 0);

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
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setExecutionResult(errorMsg);
      } finally {
        setSelectedFiles([]);
        setExecutionState("completed");
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

  return {
    selectedFiles,
    isCompleted,
    isDropZoneVisible,
    executionResult,
    handleFileSelect,
    handleRemoveFile,
  };
};

useScriptModalContent;
