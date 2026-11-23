// src/renderer/features/other/useOtherViewLogic.ts

import { useCallback } from "react";

import {
  openGiftMdModal,
  openGmailModal,
  openPdfUploadModal,
  openResetStatusModal,
  openStatusSyncModal,
} from "@renderer/components/ui/modal/modalLaunchers";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { useAppStore } from "@renderer/store";

const OKI_URL = "https://oki-corefido-connect.accel-mart.com/imart/login";

export function useOtherViewLogic() {
  const openGlobalModal = useAppStore((state) => state.openGlobalModal);

  const handleOpenPdfModal = useCallback(
    () => openPdfUploadModal(openGlobalModal),
    [openGlobalModal],
  );

  const handleOpenGmailModal = useCallback(
    () => openGmailModal(openGlobalModal),
    [openGlobalModal],
  );

  const handleOpenGiftMdModal = useCallback(
    () => openGiftMdModal(openGlobalModal),
    [openGlobalModal],
  );

  const handleResetStatuses = useCallback(
    () => openResetStatusModal(openGlobalModal),
    [openGlobalModal],
  );

  const handleOpenStatusSyncModal = useCallback(
    () => openStatusSyncModal(openGlobalModal),
    [openGlobalModal],
  );

  const handleOpenOKIURL = useCallback(() => {
    void systemIpcService.openExternalWithToast(
      OKI_URL,
      "URLを開けませんでした",
    );
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