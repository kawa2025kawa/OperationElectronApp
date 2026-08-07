import { useState, useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store/index";
import { commands } from "@shared/api/commands";

type ViewKey = "dnd" | "success" | "error";

export const usePdfUploadModalLogic = (onClose: () => void) => {
  const {
    files: storeFiles,
    isProcessing,
    errorMessage,
    expireDate,
    mergePdfFiles,
    reorderPdfFiles,
    resetPdfUpload,
  } = useAppStore(
    useShallow((s) => ({
      files: s.pdfUpload.files,
      isProcessing: s.pdfUpload.isProcessing,
      errorMessage: s.pdfUpload.errorMessage,
      expireDate: s.pdfUpload.expireDate,
      mergePdfFiles: s.mergePdfFiles,
      reorderPdfFiles: s.reorderPdfFiles,
      resetPdfUpload: s.resetPdfUpload,
    })),
  );

  const [currentViewKey, setCurrentViewKey] = useState<ViewKey>("dnd");
  const [localError, setLocalError] = useState("");

  // UI表示用ファイルオブジェクト配列の生成をメモ化
  const files = useMemo(
    () =>
      storeFiles.map((f) => ({
        name: f.name || f.path.split(/[/\\]/).pop() || "PDFファイル",
        path: f.path,
        lastModified: 0,
      })) as unknown as File[],
    [storeFiles],
  );

  // ファイル選択・ドロップ時の絶対パス抽出ロジック
  const handleFilesSelect = useCallback(
    (selectedFiles: File[]) => {
      const filePaths = selectedFiles
        .map((file) => {
          let extractedPath = "";

          // 1. webUtils経由での絶対パス取得
          if (typeof window.electronAPI?.getFilePath === "function") {
            try {
              extractedPath = window.electronAPI.getFilePath(file);
            } catch {
              // 取得失敗時はサイレントにフォールバックへ移行
            }
          }

          // 2. Fileオブジェクト直下の path プロパティへのフォールバック
          if (
            !extractedPath &&
            "path" in file &&
            typeof file.path === "string"
          ) {
            extractedPath = file.path;
          }

          return extractedPath || file.name || "";
        })
        .filter((p): p is string => Boolean(p) && p.length > 0);

      if (filePaths.length > 0) {
        mergePdfFiles(filePaths);
      }
    },
    [mergePdfFiles],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        reorderPdfFiles(index, index - 1);
      }
    },
    [reorderPdfFiles],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < storeFiles.length - 1) {
        reorderPdfFiles(index, index + 1);
      }
    },
    [reorderPdfFiles, storeFiles.length],
  );

  const handleExecute = useCallback(async () => {
    if (storeFiles.length === 0) return;

    setLocalError("");
    try {
      const filePaths = storeFiles.map((f) => f.path);
      await commands.tempomaticUploadDocument(filePaths, expireDate);
      setCurrentViewKey("success");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : String(e));
      setCurrentViewKey("error");
    }
  }, [storeFiles, expireDate]);

  const handleRetry = useCallback(() => {
    setCurrentViewKey("dnd");
  }, []);

  const handleCancelAndClose = useCallback(() => {
    resetPdfUpload();
    setCurrentViewKey("dnd");
    onClose();
  }, [resetPdfUpload, onClose]);

  return {
    pdfUpload: {
      files,
      isProcessing,
      errorMessage: localError || errorMessage,
    },
    currentViewKey,
    isHovering: false,
    handleMoveUp,
    handleMoveDown,
    handleExecute,
    handleRetry,
    handleCancelAndClose,
    handleFilesSelect,
  };
};
