// src/renderer/features/operation/components/modal/pdfUploadModal/usePdfUploadModalLogic.ts

import { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@shared/store";

type ViewKey = "dnd" | "success" | "error";

export const usePdfUploadModalLogic = (onClose: () => void) => {
  const {
    storeFiles,
    isProcessing,
    errorMessage,
    mergePdfFiles,
    reorderPdfFiles,
    uploadPdfFiles,
    resetPdfUpload,
  } = useAppStore(
    useShallow((state) => ({
      storeFiles: state.pdfUpload.files,
      isProcessing: state.pdfUpload.isProcessing,
      errorMessage: state.pdfUpload.errorMessage,
      mergePdfFiles: state.mergePdfFiles,
      reorderPdfFiles: state.reorderPdfFiles,
      uploadPdfFiles: state.uploadPdfFiles,
      resetPdfUpload: state.resetPdfUpload,
    })),
  );

  const [currentViewKey, setCurrentViewKey] = useState<ViewKey>("dnd");

  const files = useMemo(
    () =>
      storeFiles.map((file) => ({
        name: file.name || file.path.split(/[/\\]/).pop() || "PDFファイル",
        path: file.path,
        lastModified: 0,
      })) as unknown as File[],
    [storeFiles],
  );

  const fileCount = files.length;

  const handleFilesSelect = useCallback(
    (selectedFiles: File[]) => {
      const filePaths = selectedFiles
        .map((file) => {
          if (typeof window.electronAPI?.getFilePath === "function") {
            try {
              return window.electronAPI.getFilePath(file) || "";
            } catch (error) {
              console.warn(
                "[usePdfUploadModalLogic] failed to get file path",
                error,
              );
              return "";
            }
          }

          if ("path" in file && typeof file.path === "string") {
            return file.path;
          }

          return file.name;
        })
        .filter((path): path is string => Boolean(path));

      if (filePaths.length === 0) {
        return;
      }

      mergePdfFiles(filePaths);
      setCurrentViewKey("dnd");
    },
    [mergePdfFiles],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0 || isProcessing) {
        return;
      }

      reorderPdfFiles(index, index - 1);
    },
    [isProcessing, reorderPdfFiles],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= storeFiles.length - 1 || isProcessing) {
        return;
      }

      reorderPdfFiles(index, index + 1);
    },
    [isProcessing, reorderPdfFiles, storeFiles.length],
  );

  const handleExecute = useCallback(async () => {
    if (storeFiles.length === 0 || isProcessing) {
      return;
    }

    try {
      // 内部で executeScript("30") が呼ばれ、他ジョブ同様のLOADING表示＆dispatchScript("30")の実行が行われる
      await uploadPdfFiles();
      setCurrentViewKey("success");
    } catch (error) {
      console.error("[usePdfUploadModalLogic] upload failed", error);
      setCurrentViewKey("error");
    }
  }, [isProcessing, storeFiles.length, uploadPdfFiles]);

  const handleRetry = useCallback(() => {
    resetPdfUpload();
    setCurrentViewKey("dnd");
  }, [resetPdfUpload]);

  const handleCancelAndClose = useCallback(() => {
    resetPdfUpload();
    setCurrentViewKey("dnd");
    onClose();
  }, [onClose, resetPdfUpload]);

  return {
    files,
    fileCount,
    isProcessing,
    errorMessage,
    currentViewKey,
    isHovering: false,

    handleFilesSelect,
    handleMoveUp,
    handleMoveDown,
    handleExecute,
    handleRetry,
    handleCancelAndClose,
  };
};
