// src/renderer/components/ui/button/pollingToggleButton/PollingToggleButton.tsx

import React, { useCallback } from "react";
import { useAppStore } from "@renderer/store";
import { showToast } from "@renderer/utils/toastUtils";
import { useShallow } from "zustand/react/shallow";
import { APP_VIEW_IDS } from "@renderer/registry/appRegistry";
import * as styles from "./pollingToggleButton.css";

export const PollingToggleButton: React.FC = () => {
  const {
    isPolling,
    isAuthenticated,
    setCurrentView,
    startPolling,
    stopPolling,
    resetAllOperationStatuses,
    openGlobalModal,
    updateModalConfig,
    closeGlobalModal,
  } = useAppStore(
    useShallow((state) => ({
      isPolling: state.isPolling,
      isAuthenticated: state.isAuthenticated,
      setCurrentView: state.setCurrentView,
      startPolling: state.startPolling,
      stopPolling: state.stopPolling,
      resetAllOperationStatuses: state.resetAllOperationStatuses,
      openGlobalModal: state.openGlobalModal,
      updateModalConfig: state.updateModalConfig,
      closeGlobalModal: state.closeGlobalModal,
    })),
  );

  const handleClick = useCallback(() => {
    const timeStr = new Date().toLocaleTimeString("ja-JP", { hour12: false });
    if (isPolling) {
      console.log(
        `[PollingButton] 🔴 監視停止ボタンがクリックされました (${timeStr})`,
      );
      stopPolling();
    } else {
      console.log(
        `[PollingButton] 🟢 監視開始ボタンがクリックされました (${timeStr})`,
      );
      startPolling();
    }
  }, [isPolling, startPolling, stopPolling]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isPolling) return;

      if (!isAuthenticated) {
        showToast("Google認証が必要です。ログイン画面へ移動します", "error");
        setCurrentView?.(APP_VIEW_IDS.AUTH);
        return;
      }

      openGlobalModal(
        "スプレッドシートから最新マスターを取得し、ステータスをリセットしますか？",
        {
          title: "ステータスの全リセット",
          confirmText: "リセット実行",
          cancelText: "キャンセル",
          onConfirm: async () => {
            updateModalConfig({ isProcessing: true });

            try {
              await resetAllOperationStatuses();

              showToast(
                "最新マスターを取得し、ステータスをリセットしました",
                "success",
              );
              closeGlobalModal();
            } catch (error) {
              console.error("Failed to reset operation statuses:", error);
              const message =
                error instanceof Error ? error.message : String(error);
              showToast(`ステータスリセットエラー: ${message}`, "error");
            } finally {
              updateModalConfig({ isProcessing: false });
            }
          },
        },
      );
    },
    [
      isPolling,
      isAuthenticated,
      setCurrentView,
      openGlobalModal,
      updateModalConfig,
      closeGlobalModal,
      resetAllOperationStatuses,
    ],
  );

  const title = isPolling
    ? "システム稼働中（クリックで停止）"
    : "左クリック: 監視開始 / 右クリック: 最新マスター取得 & 全データリセット";

  return (
    <button
      type="button"
      tabIndex={-1}
      onFocus={(e) => e.currentTarget.blur()}
      className={styles.button}
      aria-pressed={isPolling}
      aria-label={isPolling ? "システム監視中" : "システム監視停止中"}
      title={title}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.content}>
        <div className={styles.indicatorContainer}>
          <span className={isPolling ? styles.onlineDot : styles.offlineDot} />
        </div>

        <span className={styles.label}>
          {isPolling ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
        </span>
      </div>
    </button>
  );
};
