// src/renderer/features/other/useOtherViewLogic.ts

import { createElement } from "react";

import { GiftMdModalContent } from "@renderer/features/other/components/modal/contents/giftMd/GiftMdModalContent";
import { GmailDraftContent } from "@renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent";
import { PdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent";
import { ResetStatusModalContent } from "@renderer/features/other/components/modal/contents/resetStatus/ResetStatusModalContent";
import { useAppStore } from "@renderer/store";

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
    openGlobalModal(createElement(ResetStatusModalContent), {
      title: "ステータスの全リセット",
    });
  };

  return {
    handleOpenPdfModal,
    handleOpenGmailModal,
    handleOpenGiftMdModal,
    handleResetStatuses,
  };
}
