// electron/features/operation/application/statusNotifier.ts

import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "@shared/types/constants/ipcChannelsTypes";
import type {
  OperationStatusNotification,
  OperationStatusState,
} from "@shared/types/operation/operationTypes";
import type { ReadyStatusListener, StatusTarget } from "./statusTypes";

const readyStatusListeners = new Set<ReadyStatusListener>();

function broadcast(notification: OperationStatusNotification): void {
  const windows = BrowserWindow.getAllWindows();

  for (const window of windows) {
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
      try {
        window.webContents.send(
          IPC_CHANNELS.OPERATION.STATUS_UPDATED,
          notification,
        );
      } catch (error) {
        console.error("[StatusNotifier] 送信エラー:", error);
      }
    }
  }
}

export function notifyStatusUpdated(status: OperationStatusState): void {
  broadcast({
    type: "updated",
    update: status,
  });
}

export function notifyStatusCleared(kanriNo: string): void {
  broadcast({
    type: "cleared",
    kanriNo,
  });
}

export function notifyReady(target: StatusTarget): void {
  for (const listener of readyStatusListeners) {
    try {
      listener(target);
    } catch (error) {
      console.error("[StatusNotifier] READY listener error:", error);
    }
  }
}

export function onReadyStatus(listener: ReadyStatusListener): () => void {
  readyStatusListeners.add(listener);

  return () => {
    readyStatusListeners.delete(listener);
  };
}
