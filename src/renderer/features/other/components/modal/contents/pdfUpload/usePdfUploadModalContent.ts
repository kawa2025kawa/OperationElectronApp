// src/renderer/features/pdfUpload/components/modal/usePdfUploadModalContent.ts

import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";

export function usePdfUploadModalContent() {
  const {
    files,
    isProcessing,
    addPdfFiles,
    reorderPdfFiles,
    updatePdfUpload,
    uploadPdfFiles,
    updateModalConfig,
  } = useAppStore(
    useShallow((s) => ({
      files: s.pdfUpload.files,
      isProcessing: s.pdfUpload.isProcessing,
      addPdfFiles: s.addPdfFiles,
      reorderPdfFiles: s.reorderPdfFiles,
      updatePdfUpload: s.updatePdfUpload,
      uploadPdfFiles: s.uploadPdfFiles,
      updateModalConfig: s.updateModalConfig,
    })),
  );

  const handleRemovePdfFile = useCallback(
    (targetIndex: number) => {
      const nextFiles = files.filter((_, index) => index !== targetIndex);
      updatePdfUpload({ files: nextFiles });
      // ファイル削除時に成功/失敗メッセージを消去する
      updateModalConfig({ message: null });
    },
    [files, updatePdfUpload, updateModalConfig],
  );

  const handleClearPdfFiles = useCallback(() => {
    updatePdfUpload({ files: [] });
    updateModalConfig({ message: null });
  }, [updatePdfUpload, updateModalConfig]);

  // アップロード実行処理とメッセージ更新
  const handleExecuteUpload = useCallback(async () => {
    updateModalConfig({ isProcessing: true, message: null });
    try {
      await uploadPdfFiles();
      // 🎯 成功メッセージを表示
      updateModalConfig({
        message: {
          text: "ファイルのアップロードが正常に完了しました。",
          type: "success",
        },
      });
    } catch {
      // 🎯 失敗メッセージを表示
      updateModalConfig({
        message: {
          text: "アップロード処理に失敗しました。再度お試しください。",
          type: "error",
        },
      });
    } finally {
      updateModalConfig({ isProcessing: false });
    }
  }, [uploadPdfFiles, updateModalConfig]);

  return {
    state: {
      files,
      isProcessing,
      isEmpty: files.length === 0,
    },
    actions: {
      addPdfFiles,
      reorderPdfFiles,
      handleRemovePdfFile,
      handleClearPdfFiles,
      handleExecuteUpload,
    },
  };
}
