// src/renderer/features/other/OtherView.tsx

import { memo, useCallback } from "react";
import {
  openGiftMdModal,
  openGmailModal,
  openPdfUploadModal,
  openResetStatusModal,
  openStatusSyncModal,
} from "@renderer/components/ui/modal/modalLaunchers";
import { systemIpcService } from "@renderer/services/ipcServices";
import { useAppStore } from "@renderer/store";
import * as styles from "./otherView.css";

const OKI_URL = "https://oki-corefido-connect.accel-mart.com/imart/login";

export const OtherView = memo(() => {
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

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <button
          className={styles.card}
          onClick={handleOpenPdfModal}
          type="button"
        >
          Tempomatic PDF
        </button>

        <button
          className={styles.card}
          onClick={handleOpenGmailModal}
          type="button"
        >
          Gmail
        </button>

        <button
          className={styles.card}
          onClick={handleOpenGiftMdModal}
          type="button"
        >
          ギフトMD処理
        </button>

        <button
          className={styles.card}
          onClick={handleResetStatuses}
          type="button"
        >
          ステータス全リセット
        </button>

        <button
          className={styles.card}
          onClick={handleOpenStatusSyncModal}
          type="button"
        >
          Status 引き継ぎ
        </button>

        <button
          className={styles.card}
          onClick={handleOpenOKIURL}
          type="button"
        >
          OKI/Aqwo000292
        </button>
      </div>
    </div>
  );
});

OtherView.displayName = "OtherView";
