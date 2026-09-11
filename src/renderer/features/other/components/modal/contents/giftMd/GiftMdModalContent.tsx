// src/renderer/features/other/components/modal/contents/giftMd/GiftMdModalContent.tsx

import React, { useEffect } from "react";
import { ActionButton } from "@renderer/components/ui/button/actionButton/ActionButton";
import { FileDropZone } from "@renderer/components/ui/fileDropZone/FileDropZone";
import { useAppStore } from "@renderer/store";
import type { GlobalModalComponent } from "@shared/types/ui/modal";
import { useGiftMdModalContent } from "./useGiftMdModalContent";

export const GiftMdModalContent: GlobalModalComponent = React.memo(() => {
  const { state, actions } = useGiftMdModalContent();
  const updateModalConfig = useAppStore((s) => s.updateModalConfig);
  const closeModal = useAppStore((s) => s.closeGlobalModal);

  // 🎯 フッター領域へ「キャンセル」と「転送実行」ボタンを注入
  useEffect(() => {
    updateModalConfig({
      footerContent: (
        <>
          <ActionButton
            variant="default"
            onClick={closeModal}
            disabled={state.isProcessing}
          >
            キャンセル
          </ActionButton>
          <ActionButton
            variant="default"
            onClick={actions.handleExecute}
            disabled={!state.hasFile || state.isProcessing}
          >
            {state.isProcessing ? "処理中..." : "転送実行"}
          </ActionButton>
        </>
      ),
    });
  }, [
    state.hasFile,
    state.isProcessing,
    actions.handleExecute,
    updateModalConfig,
    closeModal,
  ]);

  return (
    <FileDropZone
      files={state.files}
      accept=".txt,.DAT,text/plain"
      label="エラーログファイルをドラッグ＆ドロップ または クリックして選択"
      disabled={state.isProcessing}
      onFileSelect={actions.setGiftMdFileFromRaw}
    />
  );
});

// モーダルサイズ設定
GiftMdModalContent.modalSize = {
  width: "min(80vw, 850px)",
  height: "min(75vh, 650px)",
};

GiftMdModalContent.displayName = "GiftMdModalContent";
