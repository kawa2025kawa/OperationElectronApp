import { useCallback } from "react";
import { useAppStore } from "@renderer/store";

import { PdfUploadModalContent } from "./components/modal/contents/pdfUpload/PdfUploadModalContent";
import { GiftMdModalContent } from "./components/modal/contents/giftMd/GiftMdModalContent";
import { GmailDraftContent } from "./components/modal/contents/gmailDraft/GmailDraftContent";

export function useOtherViewLogic() {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const handleOpenPdfModal = useCallback(() => {
    openGlobalModal(PdfUploadModalContent, {
      title: "Tempomatic PDF",
    });
  }, [openGlobalModal]);

  const handleOpenGmailModal = useCallback(() => {
    openGlobalModal(GmailDraftContent, {
      title: "Gmail下書き作成",
    });
  }, [openGlobalModal]);

  const handleOpenGiftMdModal = useCallback(() => {
    openGlobalModal(GiftMdModalContent, {
      title: "ギフトデータMD転送",
    });
  }, [openGlobalModal]);

  return {
    handleOpenPdfModal,
    handleOpenGmailModal,
    handleOpenGiftMdModal,
  };
}
