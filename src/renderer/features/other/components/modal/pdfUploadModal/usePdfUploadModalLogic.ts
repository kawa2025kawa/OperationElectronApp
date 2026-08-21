// src/renderer/features/other/components/modal/pdfUploadModal/usePdfUploadModalLogic.ts

import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { commands } from "@shared/api/commands";
import { getFileName } from "@shared/utils/fileUtils";
import { useAppStore } from "@shared/store";

export type ViewKey = "dnd" | "success" | "error";

export interface PdfUploadFile {
  name: string;
  path: string;
}

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
  const [isDragging, setIsDragging] = useState(false);

  const files = useMemo<PdfUploadFile[]>(
    () =>
      storeFiles.map((file) => ({
        name: file.name || getFileName(file.path) || "ファイル名不明",
        path: file.path,
      })),
    [storeFiles],
  );

  const fileCount = files.length;

  const selectFiles = useCallback(
    (selectedFiles: File[]) => {
      if (isProcessing || selectedFiles.length === 0) {
        return;
      }

      const filePaths = selectedFiles
        .map((file) => {
          return (
            commands.getFilePath(file) ||
            ("path" in file && typeof file.path === "string"
              ? file.path
              : file.name)
          );
        })
        .filter(Boolean);

      if (filePaths.length === 0) {
        return;
      }

      mergePdfFiles(filePaths);
      setCurrentViewKey("dnd");
    },
    [isProcessing, mergePdfFiles],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!isProcessing) {
        setIsDragging(true);
      }
    },
    [isProcessing],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (isProcessing) {
        return;
      }

      const pdfFiles = Array.from(event.dataTransfer.files).filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
      );

      selectFiles(pdfFiles);
    },
    [isProcessing, selectFiles],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      selectFiles(Array.from(event.target.files ?? []));
      event.target.value = "";
    },
    [selectFiles],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (isProcessing || index <= 0) {
        return;
      }
      reorderPdfFiles(index, index - 1);
    },
    [isProcessing, reorderPdfFiles],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (isProcessing || index >= fileCount - 1) {
        return;
      }
      reorderPdfFiles(index, index + 1);
    },
    [fileCount, isProcessing, reorderPdfFiles],
  );

  const handleExecute = useCallback(async () => {
    if (isProcessing || fileCount === 0) {
      return;
    }

    try {
      await uploadPdfFiles();
      setCurrentViewKey("success");
    } catch (error) {
      console.error("[PdfUploadModal] uploadPdfFiles error", error);
      setCurrentViewKey("error");
    }
  }, [fileCount, isProcessing, uploadPdfFiles]);

  const handleRetry = useCallback(() => {
    resetPdfUpload();
    setCurrentViewKey("dnd");
  }, [resetPdfUpload]);

  const handleCancelAndClose = useCallback(() => {
    resetPdfUpload();
    setCurrentViewKey("dnd");
    setIsDragging(false);
    onClose();
  }, [onClose, resetPdfUpload]);

  return {
    files,
    fileCount,
    isProcessing,
    errorMessage,
    currentViewKey,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleMoveUp,
    handleMoveDown,
    handleExecute,
    handleRetry,
    handleCancelAndClose,
  };
};
