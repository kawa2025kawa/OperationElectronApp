// src/renderer/features/other/useOtherViewLogic.ts

import { createElement } from "react";

import { useAppStore } from "@renderer/store";

import { GiftMdModalContent } from "./components/modal/contents/giftMd/GiftMdModalContent";
import { GmailDraftContent } from "./components/modal/contents/gmailDraft/GmailDraftContent";
import { PdfUploadModalContent } from "./components/modal/contents/pdfUpload/PdfUploadModalContent";

const MODAL_SIZE = {
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

export function useOtherViewLogic() {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const handleOpenPdfModal = () => {
    openGlobalModal(createElement(PdfUploadModalContent), {
      title: "Tempomatic PDF",
      ...MODAL_SIZE,
    });
  };

  const handleOpenGmailModal = () => {
    openGlobalModal(createElement(GmailDraftContent), {
      title: "Gmail",
      ...MODAL_SIZE,
    });
  };

  const handleOpenGiftMdModal = () => {
    openGlobalModal(createElement(GiftMdModalContent), {
      title: "ギフトMD処理",
      ...MODAL_SIZE,
    });
  };

  const handleResetStatuses = () => {
    openGlobalModal("すべてのステータスを初期化（未実行）に戻しますか？", {
      title: "ステータスの全リセット",
      confirmText: "リセット実行",
      cancelText: "キャンセル",
      onConfirm: async () => {
        const store = useAppStore.getState();

        store.updateModalConfig({ isProcessing: true });

        try {
          await store.resetAllOperationStatuses();
          store.closeGlobalModal();
        } catch (error) {
          console.error("Failed to reset operation statuses:", error);
          store.updateModalConfig({ isProcessing: false });
        }
      },
    });
  };

  return {
    handleOpenPdfModal,
    handleOpenGmailModal,
    handleOpenGiftMdModal,
    handleResetStatuses,
  };
}
