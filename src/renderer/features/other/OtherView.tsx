//src\renderer\features\other\OtherView.tsx

import { memo } from "react";
import { clsx } from "clsx";

import { animateFadeIn } from "@renderer/styles/tokens";

import { useOtherViewLogic } from "./useOtherViewLogic";
import * as styles from "./otherView.css";

export const OtherView = memo(() => {
  const { handleOpenPdfModal, handleOpenGmailModal, handleOpenGiftMdModal } =
    useOtherViewLogic();

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
          Gmail下書き作成
        </button>

        <button
          className={styles.card}
          onClick={handleOpenGiftMdModal}
          type="button"
        >
          ギフトデータMD転送
        </button>
      </div>
    </div>
  );
});

OtherView.displayName = "OtherView";
