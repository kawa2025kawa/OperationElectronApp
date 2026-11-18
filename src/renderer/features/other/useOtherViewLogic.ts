// src/renderer/features/other/useOtherViewLogic.ts

import { useCallback } from "react";
import { toast } from "sonner";

import {
  openGiftMdModal,
  openGmailModal,
  openPdfUploadModal,
  openResetStatusModal,
  openStatusSyncModal,
} from "@renderer/components/ui/modal/modalLaunchers";
import { systemIpcService } from "@renderer/services/systemIpcService";
import { useAppStore } from "@renderer/store";
import { toErrorMessage } from "@renderer/utils/errorUtils";

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
    void systemIpcService.openExternal(OKI_URL).catch((error: unknown) => {
      toast.error(`URLを開けませんでした: ${toErrorMessage(error)}`);
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