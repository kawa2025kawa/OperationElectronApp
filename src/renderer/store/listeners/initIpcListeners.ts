// src/renderer/store/listeners/initIpcListeners.ts

import { handleStatusToastNotification } from "@renderer/components/ui/toast/statusToastHandler";
import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
import type { AppState } from "@renderer/store";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";

type GetAppState = () => AppState;

let cleanupIpcListeners: (() => void) | null = null;

// アプリ全体で使用するIPCリスナーを登録する。
export function setupInitIpcListeners(getState: GetAppState): void {
  if (cleanupIpcListeners !== null) return;

  const unbindTheme = window.electronAPI.on(
    IPC_CHANNELS.SYSTEM.THEME_CHANGED,
    (theme) => {
      if (theme === "dark" || theme === "light") {
        getState().setTheme?.(theme);
      }
    },
  );

  const unbindStatus = window.electronAPI.on(
    IPC_CHANNELS.OPERATION.STATUS_UPDATED,
    (notification) => {
      switch (notification.type) {
        case "updated":
          handleStatusToastNotification(notification.update);
          getState().applyOperationStatusUpdates([notification]);
          break;

        case "cleared":
          getState().applyOperationStatusUpdates([notification]);
          break;
      }
    },
  );

  const unbindPolling = window.electronAPI.on(
    IPC_CHANNELS.OPERATION.POLLING_CYCLE_COMPLETE,
    () => {
      getState().updateLastPollTime?.();
      usePollingToastStore.getState().markPollingCycleCompleted();
    },
  );

  cleanupIpcListeners = () => {
    unbindTheme();
    unbindStatus();
    unbindPolling();
    cleanupIpcListeners = null;
  };
}
