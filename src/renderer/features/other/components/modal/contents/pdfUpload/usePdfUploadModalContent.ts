// src/renderer/features/other/components/modal/contents/pdfUpload/usePdfUploadModalContent.ts

import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useAppStore } from "@renderer/store";

export function usePdfUploadModalContent() {
  const {
    files,
    isProcessing,
    infoMessage, // Storeからメッセージ状態を取得
    addPdfFiles,
    reorderPdfFiles,
    uploadPdfFiles,
    updateModalConfig,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      files: state.pdfUpload.files,
      isProcessing: state.pdfUpload.isProcessing,
      infoMessage: state.pdfUpload.infoMessage,
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
    },
    [reorderPdfFiles],
  );

  const handleExecuteUpload = useCallback(async () => {
    if (files.length === 0) return;
    try {
      await uploadPdfFiles();
    } catch (error) {
      // エラーメッセージの制御はすべて Store 内で行われるため握りつぶす
    }
  }, [files.length, uploadPdfFiles]);

  // モーダル全体の設定を Zustand と同期
  useEffect(() => {
    updateModalConfig({
      message: infoMessage, // ★ 常に何かしらのメッセージが入るため枠が消えない
      leftActions: [
        {
          id: "cancel",
          label: "閉じる",
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
    infoMessage,
    files.length,
    isProcessing,
    handleExecuteUpload,
    closeGlobalModal,
    updateModalConfig,
  ]);

  return {
    files,
    isProcessing,
    addPdfFiles,
    handleFileReorder,
  };
}
