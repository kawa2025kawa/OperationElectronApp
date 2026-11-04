// src/renderer/features/other/OtherView.tsx

import { memo } from "react";
import { useOtherViewLogic } from "./useOtherViewLogic";
import * as styles from "./otherView.css";

export const OtherView = memo(() => {
  const {
    handleOpenPdfModal,
    handleOpenGmailModal,
    handleOpenGiftMdModal,
    handleResetStatuses,
    handleOpenOKIURL,
  } = useOtherViewLogic();

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
