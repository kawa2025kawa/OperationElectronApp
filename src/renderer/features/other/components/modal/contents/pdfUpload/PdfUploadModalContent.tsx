// src/renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent.tsx

import React, { useEffect } from "react";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent, ModalAction } from "@shared/types/ui/modal";
import { usePdfUploadModalContent } from "./usePdfUploadModalContent";

export const PdfUploadModalContent: GlobalModalComponent = React.memo(() => {
  const { state, actions } = usePdfUploadModalContent();
  const updateModalConfig = useAppStore((s) => s.updateModalConfig);
  const closeModal = useAppStore((s) => s.closeGlobalModal);

  useEffect(() => {
    const leftActions: ModalAction[] = [];
    if (!state.isEmpty) {
      leftActions.push({
        id: "clear",
        label: "クリア",
        onClick: actions.handleClearPdfFiles,
        disabled: state.isProcessing,
      });
    }

    const rightActions: ModalAction[] = [
      {
        id: "cancel",
        label: "キャンセル",
        onClick: closeModal,
        disabled: state.isProcessing,
      },
      {
        id: "upload",
        label: state.isProcessing ? "アップロード中..." : "アップロード",
        onClick: actions.handleExecuteUpload,
        disabled: state.isEmpty || state.isProcessing,
        variant: "default",
      },
    ];

    updateModalConfig({
      leftActions,
      rightActions,
    });
  }, [
    state.isEmpty,
    state.isProcessing,
    actions.handleClearPdfFiles,
    actions.handleExecuteUpload,
    updateModalConfig,
    closeModal,
  ]);

  return (
    <FileDropZone
      files={state.files}
      accept="application/pdf,.pdf"
      label="PDFファイルをドラッグ＆ドロップ または クリックして選択"
      disabled={state.isProcessing}
      onFileSelect={actions.addPdfFiles}
      onReorderFile={actions.reorderPdfFiles}
      onRemoveFile={actions.handleRemovePdfFile}
    />
  );
});

PdfUploadModalContent.displayName = "PdfUploadModalContent";
PdfUploadModalContent.modalSize = {
  width: "min(85vw, calc(75vh * 16 / 9))",
  height: "min(75vh, calc(85vw * 9 / 16))",
};
