// src/renderer/store/listeners/initIpcListeners.ts

import { handleStatusToastNotification } from "@renderer/components/ui/toast/statusToastHandler";
import { usePollingToastStore } from "@renderer/components/ui/toast/pollingToastStore";
import type { AppState } from "@renderer/store";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type { OperationStatusState } from "@shared/types/operation/operationTypes";

type GetAppState = () => AppState;

let cleanupIpcListeners: (() => void) | null = null;

// アプリ全体で使用するIPCリスナー（テーマ・運用ステータス・ポーリング完了）を登録する。
export function setupInitIpcListeners(getState: GetAppState): void {
  if (cleanupIpcListeners !== null) {
    return;
  }

  const unbindTheme = window.electronAPI.on(
    IPC_CHANNELS.SYSTEM.THEME_CHANGED,
    (theme: unknown) => {
      if (theme === "dark" || theme === "light") {
        getState().setTheme?.(theme);
      }
    },
  );

  const unbindStatus = window.electronAPI.on(
    IPC_CHANNELS.OPERATION.STATUS_UPDATED,
    (value: unknown) => {
      if (!value) {
        return;
      }

      const updates: OperationStatusState[] = Array.isArray(value)
        ? (value as OperationStatusState[])
        : [value as OperationStatusState];

      if (updates.length === 0) {
        return;
      }

      for (const update of updates) {
        handleStatusToastNotification(update);
      }

      getState().applyOperationStatusUpdates(updates);
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
