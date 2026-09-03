// src/renderer/components/PollingToggleButton.tsx
import React, { useCallback } from "react";
import { useAppStore } from "@renderer/store";
import { showToast } from "@renderer/utils/toastUtils";
import { useShallow } from "zustand/react/shallow";
import * as styles from "./pollingToggleButton.css";

const POLLING_INTERVAL_SEC = 60;
const CIRCUMFERENCE = 50.265;

export const PollingToggleButton: React.FC = () => {
  const {
    isPolling,
    timeLeft,
    startPolling,
    stopPolling,
    resetAllOperationStatuses,
  } = useAppStore(
    useShallow((state) => ({
      isPolling: state.isPolling,
      timeLeft: state.timeLeft,
      startPolling: state.startPolling,
      stopPolling: state.stopPolling,
      resetAllOperationStatuses: state.resetAllOperationStatuses,
    })),
  );

  const handleClick = useCallback(() => {
    return isPolling ? stopPolling() : startPolling();
  }, [isPolling, startPolling, stopPolling]);

  const handleContextMenu = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isPolling) return;

      if (!window.confirm("ステータスを一括リセットしますか？")) return;

      try {
        await resetAllOperationStatuses();
      } catch (error) {
        console.error("Failed to reset operation statuses:", error);
        const message = error instanceof Error ? error.message : String(error);
        showToast(`ステータスリセットエラー: ${message}`, "error");
      }
    },
    [isPolling, resetAllOperationStatuses],
  );

  const title = isPolling
    ? "システム稼働中（クリックで停止）"
    : "左クリック: 監視開始 / 右クリック: 全データを「予定」へリセット";

  const strokeDashoffset =
    CIRCUMFERENCE -
    (CIRCUMFERENCE * (POLLING_INTERVAL_SEC - Math.max(0, timeLeft))) /
      POLLING_INTERVAL_SEC;

  return (
    <button
      type="button"
      className={styles.button}
      aria-pressed={isPolling}
      aria-label={isPolling ? "システム監視中" : "システム監視停止中"}
      title={title}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.content}>
        <div className={styles.indicatorContainer}>
          {isPolling ? (
            <svg className={styles.progressRing} viewBox="0 0 20 20">
              <circle className={styles.ringBg} cx="10" cy="10" r="8" />
              <circle
                className={styles.ringMeter}
                cx="10"
                cy="10"
                r="8"
                style={{
                  strokeDasharray: CIRCUMFERENCE,
                  strokeDashoffset,
                }}
              />
            </svg>
          ) : (
            <span className={styles.offlineDot} />
          )}
        </div>

        <span className={styles.label}>
          {isPolling ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
        </span>

        <div className={styles.timerContainer}>
          {isPolling && <span className={styles.timerText}>{timeLeft}s</span>}
        </div>
      </div>
    </button>
  );
};
