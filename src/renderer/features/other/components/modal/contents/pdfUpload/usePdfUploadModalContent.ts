// src/renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent.ts

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/shallow";

import { useAppStore } from "@renderer/store";

export function usePdfUploadModalContent() {
  const {
    files,
    isProcessing,
    addPdfFiles,
    reorderPdfFiles,
    uploadPdfFiles,
    updateModalConfig,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      files: state.pdfUpload.files,
      isProcessing: state.pdfUpload.isProcessing,
      addPdfFiles: state.addPdfFiles,
      reorderPdfFiles: state.reorderPdfFiles,
      uploadPdfFiles: state.uploadPdfFiles,
      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const handleFileReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      reorderPdfFiles(fromIndex, toIndex);

      updateModalConfig({
        message: null,
      });
    },
    [reorderPdfFiles, updateModalConfig],
  );

  const handleExecuteUpload = useCallback(async () => {
    if (files.length === 0) {
      updateModalConfig({
        message: {
          text: "アップロードするPDFファイルを選択してください。",
          type: "warning",
        },
      });

      return;
    }

    updateModalConfig({
      isProcessing: true,
      message: null,
    });

    try {
      await uploadPdfFiles();

      updateModalConfig({
        message: {
          text: "PDFファイルをアップロードしました。",
          type: "success",
        },
      });
    } catch (error) {
      console.error(
        "[usePdfUploadModalContent] Upload error:",
        error,
      );

      updateModalConfig({
        message: {
          text:
            error instanceof Error
              ? error.message
              : "PDFアップロード中にエラーが発生しました。",
          type: "error",
        },
      });
    } finally {
      updateModalConfig({
        isProcessing: false,
      });
    }
  }, [files.length, uploadPdfFiles, updateModalConfig]);

  useEffect(() => {
    updateModalConfig({
      leftActions: [
        {
          id: "cancel",
          label: "キャンセル",
          onClick: closeGlobalModal,
          disabled: isProcessing,
        },
      ],
      rightActions: [
        {
          id: "upload",
          label: isProcessing ? "処理中..." : "アップロード",
          onClick: handleExecuteUpload,
          disabled: files.length === 0 || isProcessing,
          variant: "default",
        },
      ],
    });
  }, [
    files.length,
    isProcessing,
    handleExecuteUpload,
    updateModalConfig,
    closeGlobalModal,
  ]);

  return {
    files,
    isProcessing,
    addPdfFiles,
    handleFileReorder,
  };
}