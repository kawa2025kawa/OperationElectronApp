//src\renderer\components\ui\button\pollingToggleButton\usePollingToggleButton.ts

import { useCallback } from "react";
import { useAppStore } from "@renderer/store";
import { useShallow } from "zustand/react/shallow";

export const usePollingToggleButton = () => {
  const { isPolling, startPolling, stopPolling } = useAppStore(
    useShallow((state) => ({
      isPolling: state.isPolling,
      startPolling: state.startPolling,
      stopPolling: state.stopPolling,
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

  // 右クリック機能がなくなったため、ツールチップもシンプルに変更
  const title = isPolling
    ? "システム稼働中（クリックで停止）"
    : "システム停止中（クリックで監視開始）";

  return {
    isPolling,
    title,
    handleClick,
  };
};
