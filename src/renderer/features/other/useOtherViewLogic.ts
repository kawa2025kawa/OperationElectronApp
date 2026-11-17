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
import { MODAL_PRESETS, MODAL_SIZES } from "@shared/types/ui/modal";

const OKI_URL = "https://oki-corefido-connect.accel-mart.com/imart/login";

export function useOtherViewLogic() {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const handleOpenPdfModal = useCallback(() => {
    openGlobalModal(createElement(PdfUploadModalContent), {
      ...MODAL_PRESETS.PDF_UPLOAD,
    });
  }, [openGlobalModal]);

  const handleOpenGmailModal = useCallback(() => {
    openGlobalModal(createElement(GmailDraftContent), {
      title: "Gmail",
      ...MODAL_SIZES.ULTRA_WIDE_21_9,
    });
  }, [openGlobalModal]);

  const handleOpenGiftMdModal = useCallback(() => {
    openGlobalModal(createElement(GiftMdModalContent), {
      title: "ギフトMD処理",
      ...MODAL_SIZES.ULTRA_WIDE_21_9,
    });
  }, [openGlobalModal]);

  const handleResetStatuses = useCallback(() => {
    openGlobalModal(createElement(ResetStatusModalContent), {
      title: "ステータスの全リセット",
      ...MODAL_PRESETS.SCRIPT_EXECUTION,
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
