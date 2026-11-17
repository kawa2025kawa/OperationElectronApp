// src/renderer/features/other/useOtherViewLogic.ts

import { createElement, useCallback } from "react";
import { toast } from "sonner";

import { GiftMdModalContent } from "@renderer/features/other/components/modal/contents/giftMd/GiftMdModalContent";
import { GmailDraftContent } from "@renderer/features/other/components/modal/contents/gmailDraft/GmailDraftContent";
import { PdfUploadModalContent } from "@renderer/features/other/components/modal/contents/pdfUpload/PdfUploadModalContent";
import { ResetStatusModalContent } from "@renderer/features/other/components/modal/contents/resetStatus/ResetStatusModalContent";
import { StatusSyncModalContent } from "@renderer/features/other/components/modal/contents/statusSync/StatusSyncModalContent";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { useAppStore } from "@renderer/store";
import { MODAL_SIZES } from "@shared/types/ui/modal";

const MODAL_SIZE = {
  width: "min(95vw, calc(75vh * (21 / 9)))",
  height: "min(75vh, calc(95vw * (9 / 21)))",
};

const OKI_URL = "https://oki-corefido-connect.accel-mart.com/imart/login";

export function useOtherViewLogic() {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const handleOpenPdfModal = useCallback(() => {
    openGlobalModal(createElement(PdfUploadModalContent), {
      title: "Tempomatic PDF",
      ...MODAL_SIZE,
    });
  }, [openGlobalModal]);

  const handleOpenGmailModal = useCallback(() => {
    openGlobalModal(createElement(GmailDraftContent), {
      title: "Gmail",
      ...MODAL_SIZE,
    });
  }, [openGlobalModal]);

  const handleOpenGiftMdModal = useCallback(() => {
    openGlobalModal(createElement(GiftMdModalContent), {
      title: "ギフトMD処理",
      ...MODAL_SIZE,
    });
  }, [openGlobalModal]);

  const handleResetStatuses = useCallback(() => {
    openGlobalModal(createElement(ResetStatusModalContent), {
      title: "ステータスの全リセット",
    });
  }, [openGlobalModal]);

  const handleOpenStatusSyncModal = useCallback(() => {
    openGlobalModal(createElement(StatusSyncModalContent), {
      title: "Status 引き継ぎ",
      ...MODAL_SIZES.WIDE_16_9,
    });
  }, [openGlobalModal]);

  const handleOpenOKIURL = useCallback(() => {
    void systemIpcService.openExternal(OKI_URL).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`URLを開けませんでした: ${message}`);
    });
  }, []);

  return {
    handleOpenPdfModal,
    handleOpenGmailModal,
    handleOpenGiftMdModal,
    handleResetStatuses,
    handleOpenStatusSyncModal,
    handleOpenOKIURL,
  };
}
