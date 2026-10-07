//src\renderer\features\other\OtherView.tsx

import { memo } from "react";
import { clsx } from "clsx";
import { animateFadeIn } from "@renderer/styles/tokens";
import { useOtherViewLogic } from "./useOtherViewLogic";
import * as styles from "./otherView.css";

export const OtherView = memo(() => {
  const {
    handleOpenPdfModal,
    handleOpenGmailModal,
    handleOpenGiftMdModal,
    handleResetStatuses,
  } = useOtherViewLogic();

  return (
    <div className={clsx(styles.container, animateFadeIn)}>
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

        {/* ▼ 新規追加: ステータス全リセットボタン */}
        <button
          className={styles.card}
          onClick={handleResetStatuses}
          type="button"
        >
          ステータス全リセット
        </button>
      </div>
    </div>
  );
});

OtherView.displayName = "OtherView";
