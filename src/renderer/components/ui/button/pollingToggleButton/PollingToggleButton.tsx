import React, { useCallback } from "react";
import { useAppStore } from "@shared/store";
import { showToast } from "@shared/utils/toastUtils";
import * as styles from "@renderer/components/ui/button/pollingToggleButton/pollingToggleButton.css";

export interface PollingToggleButtonProps {
  /** true: 監視中（online）/ false: 停止中（offline） */
  active: boolean;

  /** 左クリック時のトグル処理 */
  onClick: () => void;
}

export const PollingToggleButton: React.FC<PollingToggleButtonProps> = ({
  active,
  onClick,
}) => {
  // 🎯 単一のアクション関数は直列セレクターで取得（不要なオブジェクト作成を回避）
  const resetAllOperationStatuses = useAppStore(
    (s) => s.resetAllOperationStatuses,
  );

  const handleContextMenu = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      if (active) return;

      const confirmed = window.confirm("ステータスを一括リセットしますか？");

      if (!confirmed) return;

      try {
        showToast("ステータスを削除中...", "info");
        await resetAllOperationStatuses();
      } catch (error) {
        console.error("Failed to reset operation statuses:", error);
        const message = error instanceof Error ? error.message : String(error);
        showToast(`ステータスリセットエラー: ${message}`, "error");
      }
    },
    [active, resetAllOperationStatuses],
  );

  const title = active
    ? "システム稼働中"
    : "左クリック: 監視開始 / 右クリック: 全データを「予定」へリセット";

  return (
    <button
      type="button"
      className={styles.button}
      data-active={active}
      aria-pressed={active}
      aria-label={active ? "システム監視中" : "システム監視停止中"}
      title={title}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      {active ? "System Online" : "System Offline"}
    </button>
  );
};

export default PollingToggleButton;
