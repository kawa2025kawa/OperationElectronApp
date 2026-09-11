// src/renderer/features/other/useOtherViewLogic.ts

import { useCallback, useMemo } from "react";
import { useAppStore } from "@renderer/store";
import { PdfUploadModalContent } from "./components/modal/contents/pdfUpload/PdfUploadModalContent";
import { GiftMdModalContent } from "./components/modal/contents/giftMd/GiftMdModalContent";
import { GmailDraftContent } from "./components/modal/contents/gmailDraft/GmailDraftContent";

export function useOtherViewLogic() {
  const openGlobalModal = useAppStore((s) => s.openGlobalModal);

  // 1. Tempomatic PDF
  const handleOpenPdfModal = useCallback(() => {
    openGlobalModal(PdfUploadModalContent, {
      title: "Tempomatic PDF",
    });
  }, [openGlobalModal]);

  // 2. Gmail下書き作成
  const handleOpenGmailModal = useCallback(() => {
    openGlobalModal(GmailDraftContent, {
      title: "Gmail下書き作成",
    });
  }, [openGlobalModal]);

  // 3. ギフトデータMD転送
  const handleOpenGiftMdModal = useCallback(() => {
    openGlobalModal(GiftMdModalContent, {
      title: "ギフトデータMD転送",
    });
  }, [openGlobalModal]);

  // ツール一覧の動的リスト
  const tools = useMemo(
    () => [
      { id: "pdfUpload", name: "Tempomatic PDF", onClick: handleOpenPdfModal },
      {
        id: "gmailDraft",
        name: "Gmail下書き作成",
        onClick: handleOpenGmailModal,
      },
      {
        id: "giftMd",
        name: "ギフトデータMD転送",
        onClick: handleOpenGiftMdModal,
      },
    ],
    [handleOpenPdfModal, handleOpenGmailModal, handleOpenGiftMdModal],
  );

  return { state: { tools } };
}
