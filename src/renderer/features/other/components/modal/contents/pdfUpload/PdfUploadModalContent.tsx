// src/renderer/features/pdfUpload/components/modal/PdfUploadModalContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import { usePdfUploadModalContent } from "./usePdfUploadModalContent";

/**
 * モーダル本文領域（ドロップゾーン）
 */
export const PdfUploadModalContent: GlobalModalComponent = React.memo(() => {
  const { state, actions } = usePdfUploadModalContent();
  const updateModalConfig = useAppStore((s) => s.updateModalConfig);
  const closeModal = useAppStore((s) => s.closeGlobalModal);

  // 🎯 子側から親 (GlobalModalManager) のフッター領域へボタン要素を注入する
  useEffect(() => {
    updateModalConfig({
      footerContent: (
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* 左側: ファイル一覧クリアボタン */}
          <div>
            {!state.isEmpty && (
              <ActionButton
                variant="default"
                onClick={actions.handleClearPdfFiles}
                disabled={state.isProcessing}
              >
                クリア
              </ActionButton>
            )}
          </div>

          {/* 右側: キャンセル / アップロード実行ボタン */}
          <div style={{ display: "flex", gap: "8px" }}>
            <ActionButton
              variant="default"
              onClick={closeModal}
              disabled={state.isProcessing}
            >
              キャンセル
            </ActionButton>
            <ActionButton
              variant="default"
              onClick={actions.handleExecuteUpload}
              disabled={state.isEmpty || state.isProcessing}
            >
              {state.isProcessing ? "アップロード中..." : "アップロード"}
            </ActionButton>
          </div>
        </div>
      ),
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

// 静的プロパティ設定
PdfUploadModalContent.displayName = "PdfUploadModalContent";
PdfUploadModalContent.modalSize = {
  width: "min(85vw, calc(75vh * 16 / 9))",
  height: "min(75vh, calc(85vw * 9 / 16))",
};
