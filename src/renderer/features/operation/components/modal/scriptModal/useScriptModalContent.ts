// src/renderer/features/operation/components/modal/scriptModal/useScriptModalContent.ts

import { useCallback, useEffect, useState } from "react";
import { selectActiveSelectedItem } from "@renderer/features/operation/store/operationSelectors";
import type { JobResult } from "@shared/types/operation";
import { useAppStore } from "@renderer/store";
import { commands } from "@renderer/services/commands";
import { useOperationModalContext } from "../OperationModalContext";

export interface ScriptFileItem {
  name: string;
  path: string;
}

export type ExecutionState = "idle" | "completed" | "error";

const FILE_SELECTION_JOB_IDS = new Set(["E5", "E14", "E29", "E30"]);

/**
 * 管理No.の正規化（トリム ＆ 大文字化）
 */
function normalizeKanriNo(kanriNo: string | number | undefined): string {
  return String(kanriNo ?? "")
    .trim()
    .toUpperCase();
}

function requiresFileSelection(kanriNo: string): boolean {
  return FILE_SELECTION_JOB_IDS.has(kanriNo);
}

function extractFilePath(file: File): string {
  return (
    commands.getFilePath(file) ||
    ("path" in file && typeof file.path === "string" ? file.path : "") ||
    file.name
  );
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

export function useScriptModalContent() {
  const {
    registerPrimaryAction,
    registerSecondaryAction,
    kanriNo: contextKanriNo,
  } = useOperationModalContext();

  const selectedItem = useAppStore(selectActiveSelectedItem);
  const runScriptJob = useAppStore((state) => state.runScriptJob);

  const [selectedFiles, setSelectedFiles] = useState<ScriptFileItem[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [executionResult, setExecutionResult] = useState<JobResult | null>(
    null,
  );
  const [isCheckingE5, setIsCheckingE5] = useState(false);

  // Store 側の selectedItem または Context 側の kanriNo の両方をフォールバック取得
  const rawKanriNo = selectedItem?.kanriNo ?? contextKanriNo;
  const kanriNo = normalizeKanriNo(rawKanriNo);

  const isFinished = executionState !== "idle";
  const isError = executionState === "error";
  const isFileSelectionRequired = requiresFileSelection(kanriNo);
  const isDropZoneVisible = !isFinished && isFileSelectionRequired;

  const isExecutable =
    !isFinished &&
    Boolean(kanriNo) &&
    (!isFileSelectionRequired || selectedFiles.length > 0);

  const isDiffResult = isDiffExecutionResult(executionResult);
  const isHighlightError = isError || isDiffResult;

  // E5 判定（"E5" 完全一致または "E5" を含む場合）
  const isE5 = kanriNo === "E5" || kanriNo.includes("E5");

  // ファイル選択
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

  // プライマリアクション（「実行」ボタン）
  const handleExecute = useCallback(async () => {
    if (!kanriNo) return;

    const filePaths = selectedFiles.map(({ path }) => path).filter(Boolean);
    if (isFileSelectionRequired && filePaths.length === 0) return;

    try {
      const result = await runScriptJob(
        kanriNo,
        filePaths.length > 0 ? filePaths : undefined,
      );
      setExecutionResult(result);
      setExecutionState("completed");
    } catch (error) {
      setExecutionResult({ message: getErrorMessage(error) });
      setExecutionState("error");
    } finally {
      setSelectedFiles([]);
    }
  }, [isFileSelectionRequired, kanriNo, runScriptJob, selectedFiles]);

  // セカンダリアクション（E5「送信済みデータの確認」ボタン）
  const handleCheckE5Data = useCallback(async () => {
    console.log("[useScriptModalContent DEBUG] handleCheckE5Data CLICKED");
    setIsCheckingE5(true);
    try {
      console.log(
        "[useScriptModalContent DEBUG] Calling runScriptJob('E5_CHECK')...",
      );
      const result = await runScriptJob("E5_CHECK");
      console.log("[useScriptModalContent DEBUG] Result received:", result);
      setExecutionResult(result);
      setExecutionState("completed");
    } catch (error) {
      console.error("[useScriptModalContent ERROR]", error);
      setExecutionResult({ message: getErrorMessage(error) });
      setExecutionState("error");
    } finally {
      setIsCheckingE5(false);
    }
  }, [runScriptJob]);

  // プライマリアクション（「実行」ボタン）の登録
  useEffect(() => {
    registerPrimaryAction(isExecutable ? handleExecute : undefined, {
      disabled: !isExecutable,
    });

    return () => {
      registerPrimaryAction(undefined, { disabled: true });
    };
  }, [handleExecute, isExecutable, registerPrimaryAction]);

  // セカンダリアクション（「送信済みデータの確認」ボタン）の登録 (E5のみ)
  useEffect(() => {
    if (isE5 && registerSecondaryAction) {
      registerSecondaryAction(handleCheckE5Data, {
        label: isCheckingE5 ? "確認中..." : "送信済みデータの確認",
        disabled: isCheckingE5,
      });

      return () => {
        registerSecondaryAction(undefined);
      };
    }
  }, [isE5, isCheckingE5, handleCheckE5Data, registerSecondaryAction]);

  let messageText = "スクリプトを実行しますか？";
  if (isError) {
    messageText = "エラーが発生しました";
  } else if (executionState === "completed") {
    messageText = isDiffResult ? "処理完了（差分あり）" : "正常に完了しました";
  } else if (isDropZoneVisible) {
    messageText = "ファイルをドロップするか選択してください";
  }

  return {
    state: {
      messageText,
      selectedFiles,
      executionResult,
      isFinished,
      isDropZoneVisible,
      isHighlightError,
    },
    actions: {
      handleFileSelect,
      handleRemoveFile,
    },
  };
}
