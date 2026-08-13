// src/renderer/components/ui/button/pollingToggleButton/PollingToggleButton.tsx

import React, { useCallback } from "react";
import { useAppStore } from "@shared/store";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@shared/utils/toastUtils";
import * as styles from "./pollingToggleButton.css";

export const PollingToggleButton: React.FC = () => {
  // 🎯 必要な状態とアクションをすべて自力で取得
  const { isPolling, startPolling, stopPolling, resetAllOperationStatuses } =
    useAppStore(
      useShallow((state) => ({
        isPolling: state.isPolling,
        startPolling: state.startPolling,
        stopPolling: state.stopPolling,
        resetAllOperationStatuses: state.resetAllOperationStatuses,
      })),
    );

  // 左クリック: ポーリングの開始/停止
  const handleClick = useCallback(async () => {
    if (isPolling) {
      await stopPolling();
    } else {
      await startPolling();
    }
  }, [isPolling, startPolling, stopPolling]);

  // 右クリック: ステータスリセット
  const handleContextMenu = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (isPolling) return;

      const confirmed = window.confirm("ステータスを一括リセットしますか？");
      if (!confirmed) return;

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
    ? "システム稼働中"
    : "左クリック: 監視開始 / 右クリック: 全データを「予定」へリセット";

  return (
    <button
      type="button"
      className={styles.button}
      data-active={isPolling}
      aria-pressed={isPolling}
      aria-label={isPolling ? "システム監視中" : "システム監視停止中"}
      title={title}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {isPolling ? "System Online" : "System Offline"}
    </button>
  );
};

export default PollingToggleButton;
