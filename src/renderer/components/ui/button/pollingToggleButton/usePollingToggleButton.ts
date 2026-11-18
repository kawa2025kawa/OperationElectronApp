// src/renderer/components/ui/button/pollingToggleButton/usePollingToggleButton.ts

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@renderer/store";
import { useShallow } from "zustand/react/shallow";

const POLLING_INTERVAL_MS = 60_000;

export const usePollingToggleButton = () => {
  const { isPolling, lastPollTime, startPolling, stopPolling } = useAppStore(
    useShallow((state) => ({
      isPolling: state.isPolling,
      lastPollTime: state.lastPollTime,
      startPolling: state.startPolling,
      stopPolling: state.stopPolling,
    })),
  );

  // 監視開始直後（1回目の完了通知が来る前）の基準時刻
  const [startedAt, setStartedAt] = useState<number | null>(() =>
    isPolling ? Date.now() : null,
  );
  const [now, setNow] = useState<number>(() => Date.now());

  const activeStartedAt = isPolling ? startedAt : null;

  // 直近の完了時刻（lastPollTime）が開始時刻より新しければそちらを基準にする
  const anchorTime =
    lastPollTime !== null &&
    (activeStartedAt === null || lastPollTime >= activeStartedAt)
      ? lastPollTime
      : activeStartedAt;

  // 1回目の完了通知がまだ来ていない間は初回実行中とみなす
  const isInitialRunning =
    isPolling &&
    (lastPollTime === null ||
      (activeStartedAt !== null && lastPollTime < activeStartedAt));

  useEffect(() => {
    if (!isPolling || isInitialRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPolling, isInitialRunning]);

  const handleClick = useCallback(() => {
    const timeStr = new Date().toLocaleTimeString("ja-JP", { hour12: false });
    if (isPolling) {
      console.log(
        `[PollingButton] 🔴 監視停止ボタンがクリックされました (${timeStr})`,
      );
      setStartedAt(null);
      stopPolling();
    } else {
      const clickedAt = Date.now();
      console.log(
        `[PollingButton] 🟢 監視開始ボタンがクリックされました (${timeStr})`,
      );
      setStartedAt(clickedAt);
      setNow(clickedAt);
      startPolling();
    }
  }, [isPolling, startPolling, stopPolling]);

  const remainingMs = !isPolling
    ? POLLING_INTERVAL_MS
    : isInitialRunning || !anchorTime
      ? 0
      : Math.max(0, POLLING_INTERVAL_MS - (now - anchorTime));

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isSyncingNow = isPolling && remainingSeconds === 0;

  const title = !isPolling
    ? "システム停止中（クリックで監視開始）"
    : isSyncingNow
      ? "現在監視データ取得中...（クリックで停止）"
      : `システム稼働中（次回監視開始まであと${remainingSeconds}秒・クリックで停止）`;

  return {
    isPolling,
    isSyncingNow,
    remainingSeconds,
    title,
    handleClick,
  };
};
